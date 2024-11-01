// app/routes/export.js
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
    // Fetch Products
    /* await admin.graphql(`
        #graphql
        mutation {
            bulkOperationRunQuery(
                query: 
                """
                {
                    products {
                        edges {
                            node {
                                category {
                                    childrenIds
                                    fullName
                                    isArchived
                                    isLeaf
                                    isRoot
                                    level
                                    name
                                    parentId
                                }
                                descriptionHtml
                                handle
                                isGiftCard
                                media {
                                    edges {
                                        node {
                                            alt
                                            preview {
                                                image {
                                                    altText
                                                    url
                                                    src
                                                }
                                            }
                                        }
                                    }
                                }
                                metafields {
                                    edges {
                                        node {
                                            description
                                            jsonValue
                                            key
                                            namespace
                                            ownerType
                                            type
                                            value
                                        }
                                    }
                                }
                                options {
                                    edges {
                                        node {
                                            name
                                            optionValues {
                                                name
                                                swatch {
                                                    color
                                                    image {
                                                        alt
                                                        image {
                                                            altText
                                                            url
                                                            src
                                                            originalSrc
                                                        }
                                                    }
                                                }
                                            }
                                            values
                                        }
                                    }
                                }
                                productType
                                status
                                tags
                                title
                                totalInventory
                                tracksInventory
                                variants {
                                    edges {
                                        node {
                                            id
                                            title
                                            price
                                            sku
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                """
            ) {
                bulkOperation {
                id
                status
                }
                userErrors {
                field
                message
                }
            }
        }
    `); */

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
    
    console.log('::: menus: ', menus);

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
    }

    return json({ response: menus });
  } catch (error) {
    console.error('::: error: ', error);
    return json({ response: error }, { status: 500 });
  }
};