import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { Button, Card, Layout, Page, PageActions, TextField } from "@shopify/polaris";
import { useNavigate } from '@remix-run/react';

import { authenticate } from "app/shopify.server";
import db from "../db.server";
import { useState } from "react";
import { TitleBar } from "@shopify/app-bridge-react";

type Connection = {
    id: number | string;
    shop: string;
    storeName: string;
    apiKey: string;
    accessToken: string;
    url: string;
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const { shop } = session;
    const { id } = params;

    if (id === "new") {
        return json({ 
            id: "new",
            shop,
            storeName: '',
            apiKey: '',
            accessToken: '',
            url: '',
        } as Connection);
    }

    const connection = await db.connection.findUnique({
        where: {
            id: Number(id),
        },
    });

    return json(connection as Connection);
};

export async function action({ request, params }: ActionFunctionArgs) {
    const { session, admin } = await authenticate.admin(request);
    const { shop } = session;
    const data = {
        ...Object.fromEntries(await request.formData())
    };
    const connectionData = JSON.parse(data.data?.toString() || "{}");
    const connection = params.id === "new"
        ? await db.connection.create({ 
            data: {
                shop,
                storeName: connectionData.storeName,
                apiKey: connectionData.apiKey,
                accessToken: connectionData.accessToken,
                url: connectionData.url,
            }
        })
        : await db.connection.update({ 
            where: { id: Number(params.id) }, 
            data: connectionData 
        });

    if (data.action === "delete" && params.id !== "new") {
        await db.connection.delete({ where: { id: Number(params.id) } });

        return redirect("/app");
    }
    
    if (connection)
        return redirect(`/app/connection/${connection.id}`);

    return redirect("/app");
}

export default function Connection() {
    const initialConnection: Connection = useLoaderData<typeof loader>();
    const [ connection, setConnection ] = useState<Connection>(initialConnection);
    const [cleanFormState, setCleanFormState] = useState(connection);

    const isDirty = 
        JSON.stringify(connection) !== JSON.stringify(cleanFormState);
    const nav = useNavigation();
    const submit = useSubmit();
    const navigate = useNavigate();

    const isSaving = nav?.state === "submitting" && nav.formData?.get("action") !== "delete";
    const isDeleting = nav?.state === "submitting" && nav.formData?.get("action") === "delete";

    function handleSave () {
        const data = {
            data: JSON.stringify(connection)
        };

        setCleanFormState(connection);
        submit(data, { method: "post" });

        shopify.toast.show("Connection saved");
    }

    return (
        <Page primaryAction={
            <Button
                onClick={() => navigate("/app/menu-sync")}  
            >Sync</Button>
        }>
            <TitleBar
                title="Duilo Migration Tool"
            />
            <Layout>
                <Layout.Section>
                    <Card>
                        <Form>
                            <TextField
                                label="Store name"
                                value={connection?.storeName || ''}
                                autoComplete="off"
                                onChange={(value) => setConnection({ ...connection, storeName: value })}
                            />
                            <TextField
                                label="API Key"
                                value={connection?.apiKey || ''}
                                autoComplete="off"
                                onChange={(value) => setConnection({ ...connection, apiKey: value })}
                            />
                            <TextField
                                label="Access Token"
                                value={connection?.accessToken || ''}
                                autoComplete="off"
                                onChange={(value) => setConnection({ ...connection, accessToken: value })}
                            />
                            <TextField
                                label="Shopify URL"
                                value={connection?.url || ''}
                                autoComplete="off"
                                onChange={(value) => setConnection({ ...connection, url: value })}
                                placeholder="https://store-name.myshopify.com"
                            />
                        </Form>
                    </Card>
                </Layout.Section>
                <Layout.Section>
                    <PageActions
                        secondaryActions={[
                        {
                            content: "Delete",
                            loading: isDeleting,
                            disabled: !connection?.id || !connection || isSaving || isDeleting,
                            destructive: true,
                            outline: true,
                            onAction: () =>
                                submit({ action: "delete" }, { method: "post" }),
                            },
                        ]}
                        primaryAction={{
                            content: "Save",
                            loading: isSaving,
                            disabled: !isDirty || isSaving || isDeleting,
                            onAction: handleSave,
                        }}
                    />
                </Layout.Section>
            </Layout>
        </Page>
    );
}