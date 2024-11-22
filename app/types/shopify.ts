export interface CollectionByHandleResponse {
    data:       Data;
    extensions: Extensions;
}

export interface Data {
    collectionByHandle: CollectionByHandle;
}

export interface CollectionByHandle {
    id:              string;
    handle:          string;
    title:           string;
    description:     string;
    descriptionHtml: string;
    image:           null;
    ruleSet:         RuleSet;
    seo:             SEO;
    sortOrder:       string;
}

export interface RuleSet {
    appliedDisjunctively: boolean;
    rules:                Rule[];
}

export interface Rule {
    column:          string;
    condition:       string;
    conditionObject: ConditionObject;
    relation:        string;
}

export interface ConditionObject {
    value?:               Value;
    metafieldDefinition?: MetafieldDefinition;
}

export interface MetafieldDefinition {
    key:         string;
    name:        string;
    namespace:   string;
    ownerType:   string;
    type:        Type;
    validations: Validation[];
}

export interface Type {
    name:     string;
    category: string;
}

export interface Validation {
    name:  string;
    type:  string;
    value: string;
}

export interface Value {
    id:       string;
    fullName: string;
    level:    number;
    name:     string;
}

export interface SEO {
    title:       null;
    description: null;
}

export interface Extensions {
    cost: Cost;
}

export interface Cost {
    requestedQueryCost: number;
    actualQueryCost:    number;
    throttleStatus:     ThrottleStatus;
}

export interface ThrottleStatus {
    maximumAvailable:   number;
    currentlyAvailable: number;
    restoreRate:        number;
}