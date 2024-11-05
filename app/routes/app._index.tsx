import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  EmptyState
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
import db from "../db.server";
import { ConnectionsLayout } from "../components";

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

export default function Index() {
  const { connections } = useLoaderData<typeof loader>() || {};

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
          url: '/app/menu-sync',
        }]
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
