// app/routes/app.menu-sync.tsx
import { json, LoaderFunction } from '@remix-run/node';

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
    parentId:   number;
    tags:       string[];
    title:      string;
    type:       string;
    url:        string;
    items?:     MenuItem[];
}

export const loader: LoaderFunction = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  async function addMenuItems(items: MenuItem[], menuId: number) {
    for (const item of items) {
        const newMenuItem = await db.menuItem.create({
            data: {
                parentId: 0,
                title: item.title,
                type: item.type,
                url: item.url,
                menuId: menuId,
            },
        });

        if (item?.items && item.items.length > 0) {
            for (const subItem of item.items) {
                const newSubMenuItem = await db.menuItem.create({
                    data: {
                        parentId: newMenuItem.id,
                        title: subItem.title,
                        type: subItem.type,
                        url: subItem.url,
                        menuId: menuId,
                    },
                });
            
                if (subItem?.items && subItem.items.length > 0) {
                    for (const subSubItem of subItem.items) {
                        await db.menuItem.create({
                            data: {
                                parentId: newSubMenuItem.id,
                                title: subSubItem.title,
                                type: subSubItem.type,
                                url: subSubItem.url,
                                menuId: menuId,
                            },
                        });
                    }
                }
            }
        }

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

    if (menus.length > 0) {
        for (const menu of menus) {
            if (menu.node.title === "Main Menu") {
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

                    await addMenuItems(menu.node.items, newMenu.id);
                }
            }
        }
        
        for (const store of connectedStores) {
            try {
                for (const menuId of savedMenus) {
                    const storeMenu = await db.menu.findFirst({
                        where: { id: menuId },
                        include: {
                            items: {
                                include: {
                                    tags: true,
                                },
                            },
                        },
                    }); 

                    if (storeMenu) {
                        const store1stMenuItems = storeMenu?.items.filter(item => item.parentId === 0);
                        const storeMenuItems = store1stMenuItems.map(item => {
                            const subMenuItems = storeMenu?.items?.filter(
                                subItem => subItem.parentId === item.id
                            );
                            return {
                                title: item.title,
                                type: "HTTP",
                                url: item.url,
                                tags: item?.tags.map(tag => tag.name) || [],
                                items: subMenuItems.map(subItem => {
                                    const subSubMenuItems = storeMenu?.items?.filter(
                                        subSubItem => subSubItem.parentId === subItem.id
                                    );
                                    return {
                                        title: subItem.title,
                                        type: "HTTP",
                                        url: subItem.url,
                                        tags: subItem?.tags.map(tag => tag.name) || [],
                                        items: subSubMenuItems.map(subSubItem => {
                                            return {
                                                title: subSubItem.title,
                                                type: "HTTP",
                                                url: subSubItem.url,
                                                tags: subSubItem?.tags.map(tag => tag.name) || [],
                                            }
                                        }) || []
                                    }
                                }) || []
                            }
                        });

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