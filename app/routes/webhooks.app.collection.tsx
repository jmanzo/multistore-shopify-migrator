import type { ActionFunctionArgs } from "@remix-run/node";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

import { authenticate } from "../shopify.server";
import { Collection, createCollection } from "../server/collections";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload, admin } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  switch (topic) {
    case "COLLECTIONS_CREATE":
      console.log("Collection created");
      await createCollection(admin as AdminApiContext, shop, payload as Collection);
      break;
  }

  return new Response(null, { status: 202 });
};