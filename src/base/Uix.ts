import { UserNode } from "../nodes/UserNode";
import { UixVector } from "./UixVector";





export const Uix = {
    [UserNode.name]: UserNode,
    [UixVector.name]: UixVector
} as const


Uix['']