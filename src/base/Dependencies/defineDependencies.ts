import { DependenciesDefinition } from "./DependenciesDefinition";




export const defineDependencies = <
    DependenciesType extends Capitalize<string>
>(
    dependenciesType: DependenciesType
) => new DependenciesDefinition(dependenciesType)