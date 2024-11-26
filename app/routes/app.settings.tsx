import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Checkbox,
  PageActions
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useLoaderData, useNavigation, useSubmit } from '@remix-run/react';

import { authenticate } from "../shopify.server";
import db from "../db.server";

type Settings = {
    id?:         number;
    shop?:       string;
    products:    boolean;
    collections: boolean;
    navigations: boolean;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;

    const settings = await db.setting.findUnique({ where: { shop } });

    return json(settings || { products: false, collections: false, navigations: false });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;
    const formData = await request.formData();
    const settingsData = {
        shop,
        products: formData.get("products") === "true",
        collections: formData.get("collections") === "true",
        navigations: formData.get("navigations") === "true",
    };

    await db.setting.upsert({
        where: { shop },
        update: settingsData,
        create: settingsData
    });

    return redirect("/app/settings");
};

export default function Index() {
    const loaderData: Settings = useLoaderData<typeof loader>();
    const [ settings, setSettings ] = useState(loaderData);
    const [ cleanFormState, setCleanFormState ] = useState(settings);

    const navigation = useNavigation();
    const submit = useSubmit();
    const isSaving = navigation.state === 'submitting';
    const isDirty = JSON.stringify(settings) !== JSON.stringify(cleanFormState);

    const handleSave = () => {
        setCleanFormState(settings);
        submit(settings, {
            method: 'post',
            action: '/app/settings'
        });
    }

    return (
        <Page>
            <BlockStack gap="500">
                <Layout>
                    <TitleBar
                        title="Settings"
                    />
                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <Text as="h1" variant="headingLg">Data Synchronization</Text>
                                <BlockStack gap="200">
                                    <Text as="h2" variant="headingMd">Products</Text>
                                    <Checkbox
                                        label="Enable Products Synchronization"
                                        checked={settings?.products}
                                        onChange={() => setSettings({ ...settings, products: !settings.products })}
                                    />
                                </BlockStack>
                                <BlockStack gap="200">
                                    <Text as="h2" variant="headingMd">Collections</Text>
                                    <Checkbox
                                        label="Enable Collections Synchronization"
                                        checked={settings?.collections}
                                        onChange={() => setSettings({ ...settings, collections: !settings.collections })}
                                    />
                                </BlockStack>
                                <BlockStack gap="200">
                                    <Text as="h2" variant="headingMd">Navigations</Text>
                                    <Checkbox
                                        label="Enable Navigations Synchronization"
                                        checked={settings?.navigations}
                                        onChange={() => setSettings({ ...settings, navigations: !settings.navigations })}
                                    />
                                </BlockStack>
                            </BlockStack>
                        </Card>
                    </Layout.Section>
                    <Layout.Section>
                        <PageActions
                            primaryAction={{
                                content: "Save",
                                loading: isSaving,
                                disabled: !isDirty || isSaving,
                                onAction: handleSave,
                            }}
                        />
                    </Layout.Section>
                </Layout>
            </BlockStack>
        </Page>
    );
}
