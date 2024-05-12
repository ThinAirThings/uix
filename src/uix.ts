import { DependenciesDefinition } from "./base/Dependencies/DependenciesDefinition";
import { FunctionInterfaceDefinition } from "./base/FunctionInterfaces/FunctionInterfaceDefinition";
import { RelationshipDefinition } from "./base/Relationship/RelationshipType";
import { SystemDefinition } from "./base/System/SystemDefinition";
import { NodeDefinition } from "./base/defineNode";


export const uix = {
    System: SystemDefinition,
    Dependencies: DependenciesDefinition,
    Node: NodeDefinition,
    Relationship: RelationshipDefinition,
    FunctionInterface: FunctionInterfaceDefinition
} as const