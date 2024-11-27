import { createShopifyMenuFromConnection } from "app/helpers/shopify";

import { getMenuFromConnection, updateShopifyMenuFromConnection } from "app/helpers/shopify";

import { getMenus } from "app/helpers/shopify";
import { NodeMenu } from "app/types";
import db from "app/db.server";
import { AdminApiContext } from "@shopify/shopify-app-remix/server";
import { Setting } from "app/types";

export async function syncMenus(shop: string, admin: AdminApiContext) {
    const data = await getMenus(admin);
    const menus = data?.data?.menus?.edges || [];
    const setting = await db.setting.findUnique({
        where: { shop },
    }) as Setting;

    if (setting?.navigations) {
        const connectedStores = await db.connection.findMany({
            where: { shop },
        });
    
        if (menus.length > 0) {
          for (const store of connectedStores) {
            for (const menu of menus) {
              const connectedMenu = await getMenuFromConnection(store, menu);
              const menuFromConnection = connectedMenu?.data?.menus?.edges.find(
                (edge: NodeMenu) => edge.node.handle === menu.node.handle
              )?.node || null;
    
              if (menuFromConnection) {
                await updateShopifyMenuFromConnection(store, menuFromConnection.id, menu);
              } else {
                await createShopifyMenuFromConnection(store, menu);
              }
            }
          }
        }
    }
}