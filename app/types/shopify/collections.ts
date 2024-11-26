export interface CollectionPayload {
    admin_graphql_api_id?:  string;
    handle:                 string;
    title:                  string;
    body_html:              string;
    sort_order:             string;
    disjunctive?:           boolean;
    rules?:                 RulePayload[];
    image?:                 string;
    seo?:                   string;
    fromConnectionId?:      string;
}

export interface RulePayload {
    column:                 string;
    condition:              string;
    condition_object_id?:   string;
    relation:               string;
}