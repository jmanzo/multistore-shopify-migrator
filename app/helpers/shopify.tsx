// TODO: Optimize the query and mutation operations.

import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import type { Connection } from "../server/collections";
import { CollectionPayload } from "../types/shopify/collections";
import { MetafieldDefinition, MetafieldsByDefinitionResponse, Type, Validation } from "../types/shopify/metafields";

export const createShopifyCollection = async (
  admin: AdminApiContext, 
  connections: Connection[], 
  payload: CollectionPayload
) => {
  console.info('--- payload: ', payload);
  
  for (const connection of connections) {
    const formattedPayload: CollectionPayload = {
      ...payload,
      rules: await Promise.all((payload.rules || []).map(async rule => {
        const metafieldId = rule?.condition_object_id;
        const metafieldResponse = metafieldId ? await getMetafield(admin, metafieldId) : null;
        const metafieldDefinition = metafieldResponse?.data?.metafieldDefinition;
        const metafieldFromConnection = await getMetafieldsFromConnection(connection, metafieldDefinition);
        return {
          ...rule,
          condition_object_id: metafieldDefinition 
            ? metafieldFromConnection.id
            : undefined,
        };
      })),
    }
  
    console.info("--- formattedPayload: ", formattedPayload);
    
    const collectionFromConnectionReq = await getCollectionFromConnection(connection, payload.handle);
    const collectionFromConnection = collectionFromConnectionReq?.data?.collectionByHandle;
    
    if (!collectionFromConnection) {
      console.info("--- Collection not found in connection: ", connection.url);
      await createShopifyCollectionFromConnection(
        connection, 
        formattedPayload
      );
    } else {
      console.info("--- Collection found in connection: ", connection.shop);
    }
  }
};

const getMetafieldsFromConnection = async (
  connection: Connection, 
  metafieldDefinition: MetafieldDefinition
) => {
  const metafieldsResponse = await getMetafieldByDefinition(connection, metafieldDefinition) as 
    MetafieldsByDefinitionResponse;
  const metafieldData = metafieldsResponse.data.metafieldDefinitions.edges

  if (metafieldData && metafieldData.length > 0) {
    console.info("--- metafield exists ---");
    return metafieldData[0].node;
  }
  
  console.info("--- metafield doesn't exist ---");

  const metafieldMutation = await createMetafield(connection, metafieldDefinition);

  if (metafieldMutation && metafieldMutation.data) {
    console.info("--- metafield created ---");
    return metafieldMutation.data.metafieldDefinitionCreate.createdDefinition;
  }
}

const createMetafield = async (
  connection: Connection, 
  metafieldDefinition: MetafieldDefinition
) => {
  const operation = `
    #graphql
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          name
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;
  const response = await fetch(
    connection.url + '/admin/api/2024-10/graphql.json', 
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': connection.accessToken,
      },
      body: JSON.stringify({
        query: operation,
        variables: {
          definition: {
            description: metafieldDefinition.description,
            key: metafieldDefinition.key,
            namespace: metafieldDefinition.namespace,
            name: metafieldDefinition.name,
            ownerType: metafieldDefinition.ownerType,
            type: metafieldDefinition.type.name,
            validations: metafieldDefinition.validations.map(val => ({
              name: val.name,
              value: val.value,
            })),
          }
        },
      }),
    }
  );

  return await response.json();
}

const getMetafieldByDefinition = async (connection: Connection, metafieldDefinition: MetafieldDefinition) => {
  try {
    const operation = `
      #graphql
      query {
        metafieldDefinitions(
          first: 1,
          ownerType: PRODUCT,
          key: "${metafieldDefinition.key}",
          namespace: "${metafieldDefinition.namespace}"
        ) {
          edges {
            node {
              description
              id
              key
              namespace
              name
              ownerType
              pinnedPosition
              type {
                category
                name
                supportedValidations {
                  name
                  type
                }
                supportsDefinitionMigrations
              }
              useAsCollectionCondition
              validationStatus 
              validations {
                name
                type
                value
              }
            }
          }
        }
      }
    `;
    const response = await fetch(
      connection.url + '/admin/api/2024-10/graphql.json', 
      {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': connection.accessToken,
          },
          body: JSON.stringify({
            query: operation,
            variables: {
              first: 1,
              ownerType: "PRODUCT",
              key: metafieldDefinition.key,
              namespace: metafieldDefinition.namespace
            },
          }),
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error("x Error getting metafield: ", error);
    return [];
  }
}

const getMetafield = async (admin: AdminApiContext, id: string) => {
  try {
    const response = await admin.graphql(
      `#graphql
      query {
        metafieldDefinition(
          id: "gid://shopify/MetafieldDefinition/${id}"
        ) {
          description
          id
          key
          namespace
          name
          ownerType
          pinnedPosition
          type {
            category
            name
            supportedValidations {
              name
              type
            }
            supportsDefinitionMigrations
          }
          useAsCollectionCondition
          validationStatus 
          validations {
            name
            type
            value
          }
        }
      }`
    );

    return await response.json();
  } catch (error) {
    console.error("x Error getting metafield: ", error);
    return null;
  }
}

const getCollectionFromConnection = async (connection: Connection, handle: string) => {
  try {
    const operation = `
      #graphql
      query getCollectionIdFromHandle($handle: String!) {
        collectionByHandle(handle: $handle) {
          id
          handle
          title
          description
          descriptionHtml
          image {
            altText
            url
          }
          ruleSet {
            appliedDisjunctively
            rules {
              column
              condition
              conditionObject {
                ... on CollectionRuleCategoryCondition {
                  value {
                    id
                    fullName
                    level
                    name
                  }
                }
                ... on CollectionRuleMetafieldCondition {
                  metafieldDefinition {
                    key
                    name
                    namespace
                    ownerType
                    type {
                      name
                      category
                    }
                    validations {
                      name
                      type
                      value
                    }
                  }
                }
                ... on CollectionRuleProductCategoryCondition {
                  productCategoryValue: value {
                    fullName
                    name
                  }
                }
                ... on CollectionRuleTextCondition {
                  textValue: value
                }
              }
              relation
            }
          }
          seo {
            title
            description
          }
          sortOrder
        }
      }
    `;
    const response = await fetch(
      connection.url + '/admin/api/2024-10/graphql.json', 
      {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': connection.accessToken,
          },
          body: JSON.stringify({
            query: operation,
            variables: {
              handle: handle,
            },
          }),
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error("x Error getting collection from connection: ", error);
    return null;
  }
}

const createShopifyCollectionFromConnection = async (
  connection: Connection, 
  payload: CollectionPayload
) => {
  try {
    const operation = `
      #graphql
      mutation createCollectionMetafields($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection {
            handle
            title
          }
          userErrors {
            message
            field
          }
        }
      }
    `;

    const response = await fetch(
      connection.url + '/admin/api/2024-10/graphql.json', 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': connection.accessToken,
        },
        body: JSON.stringify({
          query: operation,
          variables: {
            input: {
              descriptionHtml: payload?.body_html,
              handle: payload?.handle,
              title: payload?.title,
              ruleSet: {
                appliedDisjunctively: payload?.disjunctive,
                rules: payload?.rules?.map(rule => ({
                  column: rule?.column.toUpperCase(),
                  condition: rule?.condition,
                  relation: rule?.relation.toUpperCase(),
                  conditionObjectId: (rule.column === "product_metafield_definition" && rule.condition_object_id)
                    ? rule.condition_object_id
                    : undefined,
                })),
              },
              // image: payload?.image,
              // seo: payload?.seo,
              sortOrder: payload?.sort_order.toUpperCase().replace('-', '_'),
            },
          },
        }),
      }
    );

    const data = await response.json();

    console.info('--- collection: ', data?.data?.collectionCreate?.collection);
    console.warn('! userErrors: ', data?.data?.collectionCreate?.userErrors);
  } catch (error) {
    console.error("x Error creating collection in connection: ", error);
  }
}