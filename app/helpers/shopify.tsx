import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import type { Collection, Connection } from "../server/collections";
import { CollectionByHandleResponse } from "../types/shopify";

export const createShopifyCollection = async (admin: AdminApiContext, connections: Connection[], payload: Collection) => {
  console.log("::: Creating collection", payload);

  const getCollectionReq = await getCollection(admin, payload.handle);
  const collection = getCollectionReq?.data?.collectionByHandle;

  if (collection) {
    console.log("::: Collection already exists: ", collection);
    return;
  }
};

const getCollection = async (admin: AdminApiContext, handle: string) => {
  const response = await admin.graphql(
    `#graphql
    query {
      collectionByHandle(handle: "${handle}") {
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
    }`,
  );

  return await response.json() as CollectionByHandleResponse;
}
