import { defineRootNodeType } from "@thinairthings/uix";
import { UserNodeType } from "./UserNodeType";
import { JobNodeType } from "./JobNodeType";




export const RootNodeType = defineRootNodeType()
    .defineNodeSetRelationship(UserNodeType)
    .defineNodeSetRelationship(JobNodeType)