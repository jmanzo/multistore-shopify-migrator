import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  EmptyState
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
import db from "../db.server";
import { ConnectionsLayout } from "../components";
import { createShopifyMenuFromConnection, getMenuFromConnection, getMenus, updateShopifyMenuFromConnection } from "app/helpers/shopify";
import { NodeMenu } from "app/types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const connections = await db.connection.findMany({
    where: {
      shop,
    },
  });

   return json({ connections });
};

export async function action({ request, params }: ActionFunctionArgs) {
  const {admin} = await authenticate.admin(request);

  try {
    const data = await getMenus(admin);
    const menus = data?.data?.menus?.edges || [];
    const connectedStores = await db.connection.findMany();

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
  } catch (error) {
    console.error('x Error syncing menus: ', error);
  }

  return redirect("/app/connections");
}

export default function Index() {
  const { connections } = useLoaderData<typeof loader>() || {};
  const shopify = useAppBridge();
  const submit = useSubmit();

  const EmptyStateExample = () => {
    return (
      <Card>
        <EmptyState
          heading="No connections found"
          action={{
            content: 'Add connection', 
            url: '/app/connection/new'
          }}
          secondaryAction={{
            content: 'Learn more',
            url: 'https://help.shopify.com',
          }}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Add a connection to start migrating your products.</p>
        </EmptyState>
      </Card>
    );
  }

  return (
    <Page
      primaryAction={{
        content: 'Create Connection',
        url: '/app/connection/new',
      }}
      actionGroups={[{
        title: 'Actions',
        actions: [{
          content: 'Sync Menu',
          onAction: async () => {
            shopify.toast.show('Syncing Menus');
            submit(null, { method: "post" });
          }
        }],
      }]}
    >
      <BlockStack gap="500">
        <Layout>
          <TitleBar
            title="Duilo Migration Tool"
          />
          <Layout.Section>
            {connections.length === 0 
              ? <EmptyStateExample /> 
              : <ConnectionsLayout connections={
                connections.map(connection => ({
                  ...connection, 
                  id: connection.id.toString(), 
                  apiKey: connection.apiKey
                }))} />
            }
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
