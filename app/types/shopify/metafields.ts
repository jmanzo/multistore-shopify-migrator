import { Extensions } from "./response";

export interface MetafieldDefinitionResponse {
    data:       MetafieldDefinitionData;
    extensions: Extensions;
}

export interface MetafieldDefinitionData {
    metafieldDefinition: MetafieldDefinition;
}

export interface MetafieldDefinition {
    description:              string;
    id:                       string;
    key:                      string;
    namespace:                string;
    name:                     string;
    ownerType:                string;
    pinnedPosition:           number;
    type:                     Type;
    useAsCollectionCondition: boolean;
    validationStatus:         string;
    validations:              Validation[];
}

export interface Type {
    category:                     string;
    name:                         string;
    supportedValidations:         SupportedValidation[];
    supportsDefinitionMigrations: boolean;
}

export interface SupportedValidation {
    name: string;
    type: string;
}

export interface Validation {
    name:  string;
    type:  string;
    value: string;
}

// ### --- Metafields By Definition --- ###

export interface MetafieldsByDefinitionResponse {
    data:       MetafieldsByDefinitionData;
    extensions: Extensions;
}

export interface MetafieldsByDefinitionData {
    metafieldDefinitions: MetafieldDefinitions;
}

export interface MetafieldDefinitions {
    edges: Edge[];
}

export interface Edge {
    node: Node;
}

export interface Node {
    description:              string;
    id:                       string;
    key:                      string;
    namespace:                string;
    name:                     string;
    ownerType:                string;
    pinnedPosition:           number;
    type:                     Type;
    useAsCollectionCondition: boolean;
    validationStatus:         string;
    validations:              Validation[];
}

export interface Type {
    category:                     string;
    name:                         string;
    supportedValidations:         SupportedValidation[];
    supportsDefinitionMigrations: boolean;
}

export interface SupportedValidation {
    name: string;
    type: string;
}

export interface Validation {
    name:  string;
    type:  string;
    value: string;
}