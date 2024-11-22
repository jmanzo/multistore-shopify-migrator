import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

import db from "../db.server";
import { createShopifyCollection } from "../helpers/shopify";

export type Collection = {
    id: number;
    handle: string;
    title: string;
    updated_at: string;
    body_html: string;
    published_at: string;
    sort_order: null;
    template_suffix: null;
    published_scope: string;
    admin_graphql_api_id: string;
}

export type Connection = {
  id: number;
  shop: string;
  storeName: string;
  accessToken: string;
  apiKey: string;
  url: string;
};

export const createCollection = async (admin: AdminApiContext, shop: string, payload: Collection) => {
    const settings = await db.setting.findUnique({
        where: { shop },
    });
    const connections: Connection[] = await db.connection.findMany({
        where: { shop },
    });

    if (!settings) {
        throw new Error("Settings not found");
    }

    if (!settings.collections || connections.length === 0) {
        return;
    }

    console.log("::: Collection creation is enabled :::");
    console.log('::: payload', payload);
    console.log('::: connections', connections);
    console.log('::: settings', settings);
    console.log("::: =============================== :::");

    return await createShopifyCollection(admin, connections, payload);
};
