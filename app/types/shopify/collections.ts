export interface CollectionPayload {
    handle: string;
    title: string;
    body_html: string;
    sortOrder: string;
    disjunctive?: boolean;
    rules?: RulePayload[];
}

export interface RulePayload {
    column:          string;
    condition:       string;
    condition_object_id: string;
    relation:        string;
}