import type { ActionFunctionArgs } from "@remix-run/node";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

import { authenticate } from "../shopify.server";
import { CollectionPayload } from "../types/shopify/collections";
import { updateCollection } from "../server/collections";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload, admin } = await authenticate.webhook(request);

  console.log(`--- Received ${topic} webhook for ${shop} ---`);

  switch (topic) {
    case "COLLECTIONS_DELETE":
      console.log("--- Collection Deleted ---");
      break;
    default:
      console.info("--- Collection Updated ---");
      await updateCollection(admin as AdminApiContext, shop, payload as CollectionPayload);
      break;
  }

  return new Response(null, { status: 202 });
};