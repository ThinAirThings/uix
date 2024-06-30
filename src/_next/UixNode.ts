
import { RootNodeType, UserNodeType, HirebirdNodeTypes } from "@hirebirdcode/nodetypes"
import { AnyNodeType, AnyRelationshipTypeSet, GenericNodeType, GenericRelationshipType, GenericRelationshipTypeSet, NodeState, NodeType } from "@thinairthings/uix";
import { nodeTypeMap } from "./generated/staticObjects";
import { getNodeByKey } from "./generated/functionModule";




// InstanceType<typeof UixNode<typeof nodeTypeMap[NextType]>>
const functionSet: ((...args: any[]) => any)[] = []

const getActiveUserNodeId = () => ''
const createUixNode = () => {
    const functionSet: ((...args: any[]) => any)[] = []
    const initialQueryString = /*cypher*/`
        MATCH (userNode: User, {nodeId: ${getActiveUserNodeId()}})

    `
    let queryString = ''
    const nodeMap = {}
    const UixNode = class UixNodeClass<
        // ParentUixNode extends UixNodeClass<any, any>,
        ThisNodeType extends AnyNodeType,
    > {
        constructor(
            // public parentUixNode: ParentUixNode,
            public nodeType: ThisNodeType
        ) { }
        // Note: Start at the node that your at. Starting at the root time won't let you cache with react query.
        // A Master store could possibly be anti react. You will need to use a hook in each component system.
        // This is likely where you'd want to uses syncExertalStore.
        // Create nodes, pass them down, pass them into a useSyncExternalStore wrapper hook, 
        // and then call node.update, node.delete, node.create, etc on the passed down nodes.
        // Have them leave behind their hooks as they travel by passing the node into the hook. 
        // The hook will subscribe to changes in the node.
        // useNode(node => ({
        //   description: node.description,
        //})) 
        update = async (data: Partial<NodeState<ThisNodeType>>) => {
            return new UixNode(this.nodeType)
        }
        create = async <
            NextType extends ThisNodeType extends NodeType<any, any, any, any, infer RelationshipTypeSet>
            ? RelationshipTypeSet[number]['toNodeType']['type']
            : never
        >(nextType: NextType, nextTypeState: NodeState<typeof nodeTypeMap[NextType]>) => {

        }
        get = async <
            NextType extends ThisNodeType extends NodeType<any, any, any, any, infer RelationshipTypeSet>
            ? RelationshipTypeSet[number]['toNodeType']['type']
            : never
        >(nextType: NextType): UixNodeClass<typeof nodeTypeMap[NextType]> => {
            // Option 1
            const nextNode = await getNodeByKey(nextType)
            nodeMap[nextType] = nextNode
            // // Option 2 (There seems like there would be no way to invalidate the query cache)
            // if (!(this.nodeType.type === 'User')) {
            //     queryString += /*cypher*/`
            //         MATCH (thisNode: ${this.nodeType.type})<-[:CHILD_TO|UNIQUE_TO]->(parentNode: ${nextType})
            //     `
            // }
            // queryString += /*cypher*/`
            //     MATCH (node: ${})
            // `
            return new UixNode(nodeTypeMap[nextType])
        }
    }
    return {
        queryString,
        nodeMap,
        root: new UixNode(RootNodeType)
    }
}



// export function useUix(fn: (root: UixNode<typeof RootNodeType>) => void) {
//     fn(new UixNode(RootNodeType))
// }

const {
    root
} = createUixNode()
// const rootNode = new UixNode(RootNodeType)
const userNode = await root.get('User').update({

})
const profileNode = userNode.create('Education', {
    'school': "University of California, Berkeley",
    'degree': 'Associate of Applied Science (A.A.S.)',
    'fieldOfStudy': 'Computer Science'
})
