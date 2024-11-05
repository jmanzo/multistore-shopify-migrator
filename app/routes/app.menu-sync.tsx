// app/routes/export.js
import { json, LoaderFunction } from '@remix-run/node';
import { createAdminApiClient } from '@shopify/admin-api-client';

import db from '../db.server';
import { authenticate } from '../shopify.server';

interface NodeMenu {
    node: Menu;
}

interface Menu {
    id:     string;
    handle: string;
    title:  string;
    items:  MenuItem[];
}

interface MenuItem {
    tags:   string[];
    title:  string;
    type:   string;
    url:    string;
    items?: MenuItem[];
}

export const loader: LoaderFunction = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  async function addMenuItems(items: MenuItem[], menuId: number, index: number) {
    for (const item of items) {
        const newMenuItem = await db.menuItem.create({
            data: {
                position: index,
                title: item.title,
                type: item.type,
                url: item.url,
                menuId: menuId,
            },
        });

        for (const tag of item.tags) {
            await db.tag.upsert({
                where: {
                    name_menuItemId: {
                        name: tag,
                        menuItemId: newMenuItem.id
                    }
                },
                update: {
                    name: tag,
                    menuItemId: newMenuItem.id,
                },
                create: {
                    name: tag,
                    menuItemId: newMenuItem.id,
                },
            });
        }
    }
  }

  try {
    // Fetch Navigation
    const response = await admin.graphql(`
        #graphql
        query {
            menus(first: 20) {
                edges {
                node {
                    id
                    handle
                    title
                    items {
                        ... on MenuItem {
                            tags
                            title
                            type
                            url
                            items {
                            ... on MenuItem {
                                tags
                                title
                                type
                                url
                                items {
                                ... on MenuItem {
                                    tags
                                    title
                                    type
                                    url
                                }
                                }
                            }
                                }
                        }
                    }
                }
                }
            }
        }`, {}
    );

    const data = await response.json();
    const menus = data?.data?.menus?.edges || [];
    const savedMenus = [];
    const connectedStores = await db.connection.findMany();
    
    // console.log('::: menus: ', menus);

    if (menus.length > 0) {
        for (const menu of menus) {
            let position = 0;

            const newMenu = await db.menu.upsert({
                where: {
                    shopifyId_handle: {
                        shopifyId: menu.node.id,
                        handle: menu.node.handle,
                    }
                },
                update: {
                    title: menu.node.title,
                },
                create: {
                    shopifyId: menu.node.id,
                    title: menu.node.title,
                    handle: menu.node.handle,
                },
            });

            savedMenus.push(newMenu.id);

            if (menu.node.items.length > 0) {
                await db.menuItem.deleteMany({
                    where: {
                        menuId: newMenu.id,
                    },
                });

                await addMenuItems(menu.node.items, newMenu.id, position);
                
                position++;
                
                for (const item of menu.node.items) {
                    if (item.items.length > 0) {
                        await addMenuItems(item.items, newMenu.id, position);
                        position++;

                        for (const subItem of item.items) {
                            if (subItem.items.length > 0) {
                                await addMenuItems(subItem.items, newMenu.id, position);
                                position++;
                            }
                        }
                    }
                }
            }
        }
        
        for (const store of connectedStores) {
            try {
                const client = createAdminApiClient({
                    storeDomain: store.url.replace('https://', ''),
                    apiVersion: '2024-10',
                    accessToken: store.accessToken,
                });

                for (const menuId of savedMenus) {
                    const storeMenu = await db.menu.findFirst({
                        where: { id: menuId },
                        include: {
                            items: true,
                        },
                    });
                    const store1stMenuItems = storeMenu?.items.filter(item => item.position === 0);
                    const store2ndMenuItems = storeMenu?.items.filter(item => item.position === 1);
                    const store3rdMenuItems = storeMenu?.items.filter(item => item.position === 2);
                    const storeMenuItems = store1stMenuItems?.map(item => ({
                        title: item.title,
                        type: "HTTP",
                        // type: item.type,
                        url: item.url,
                        // items: store2ndMenuItems?.map(item => ({
                        //     title: item.title,
                        //     type: item.type,
                        //     url: item.url,
                        //     items: store3rdMenuItems?.map(item => ({
                        //         title: item.title,
                        //         type: item.type,
                        //         url: item.url,
                        //     })) || [],
                        // })) || [],
                    })) || [];

                    const operation = `
                        #graphql
                        mutation CreateMenu($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
                            menuCreate(title: $title, handle: $handle, items: $items) {
                                menu {
                                    id
                                    handle
                                    items {
                                        id
                                        title
                                        items {
                                            id
                                            title
                                        }
                                    }
                                }
                                userErrors {
                                    field
                                    message
                                }
                            }
                        }
                    `;

                    const response = await fetch(
                        store.url + '/admin/api/2024-10/graphql.json', 
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Shopify-Access-Token': store.accessToken,
                            },
                            body: JSON.stringify({
                                query: operation,
                                variables: {
                                    title: storeMenu?.title,
                                    handle: storeMenu?.handle + '-sync-app',
                                    items: storeMenuItems,
                                },
                            }),
                        }
                    );

                    const data = await response.json();
                    console.log('::: menu: ', data?.data?.menuCreate?.menu);
                    console.log('::: userErrors: ', data?.data?.menuCreate?.userErrors);
                }
            } catch (error) {
                console.error(`::: Error for store ${store.shop}:`, error);
            }
        }

        return json({ response: savedMenus }, { status: 200 });
    }

    return json({ response: [] }, { status: 200 });
  } catch (error) {
    console.error('::: error: ', error);
    return json({ response: error }, { status: 500 });
  }
};