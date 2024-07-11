
import { AnyNodeType, AnyRelationshipTypeSet, GenericNodeType, GenericRelationshipType, GenericRelationshipTypeSet, NodeKey, NodeState, NodeType, RelationshipType } from "@thinairthings/uix";
import { nodeTypeMap } from '../../tests/uix/generated/staticObjects'
import dedent from "dedent";

// SAVED GET RETURN TYPE
// : Promise<(ThisNodeType['relationshipTypeSet'][number] & { relationshipClass: 'Set' }) extends RelationshipType<any, any, any, infer ToNodeType, any>
//         ? typeof nodeTypeMap[NextType] extends ToNodeType
//         ? UixNode<this, typeof nodeTypeMap[NextType]>[]
//         : UixNode<this, typeof nodeTypeMap[NextType]>
//         : never
const createUixNode = () => {

}

class UixNode<
    ParentUixNode extends UixNode<any, any> | null,
    ThisNodeType extends AnyNodeType,
> {
    constructor(
        public parentUixNode: ParentUixNode,
        public nodeType: ThisNodeType,
        public nodeKey: NodeKey<typeof nodeTypeMap, ThisNodeType['type']>
    ) { }
    create = async <
        NextType extends ThisNodeType extends NodeType<any, any, any, any, infer RelationshipTypeSet, any>
        ? RelationshipTypeSet[number]['toNodeType']['type']
        : never
    >(nextType: NextType, nextTypeState: NodeState<typeof nodeTypeMap[NextType]>) => {

    }
    update = async (data: Partial<NodeState<ThisNodeType>>) => {
        return new UixNode(this.parentUixNode, this.nodeType, this.nodeKey)
    }
}

class RootUixNode extends UixNode<
    null, typeof nodeTypeMap['Root']
> {
    constructor(
        public userNodeKey: NodeKey<typeof nodeTypeMap, 'User'>
    ) {
        super(null, nodeTypeMap.Root, { nodeType: 'Root', nodeId: '0' })
    }
}

const useUserNodeKey = () => ({ nodeType: 'User', nodeId: '123' }) as NodeKey<typeof nodeTypeMap, 'User'>
const useUserNodeKeyTree = () => ({}) as {
    [Type in keyof typeof nodeTypeMap]: typeof nodeTypeMap[Type] extends typeof nodeTypeMap[keyof typeof nodeTypeMap]['relationshipTypeSet'][number]['toNodeType']
    ? (typeof nodeTypeMap[keyof typeof nodeTypeMap]['relationshipTypeSet'][number] & { relationshipClass: 'Set' }) extends RelationshipType<any, infer FromNodeType, any, infer ToNodeType, any>
    ? typeof nodeTypeMap[Type] extends ToNodeType
    ? NodeKey<typeof nodeTypeMap, Type>[]
    : NodeKey<typeof nodeTypeMap, Type>
    : never
    : NodeKey<typeof nodeTypeMap, 'Root'>
}
export const useUix = () => {
    const userNodeKey = useUserNodeKey()    // From UixProvider
    // Get all node keys
    const userNodeKeyTree = useUserNodeKeyTree()
    const uixNodes = Object.entries(userNodeKeyTree).reduce((acc, [nodeType, nodeKeyOrKeys]) => {
        if (nodeKeyOrKeys instanceof Array) {
            return Object.assign(acc, {
                [nodeType]: nodeKeyOrKeys.map(nodeKey => new UixNode(
                    null,
                    nodeTypeMap[nodeType as keyof typeof nodeTypeMap],
                    nodeKey
                ))
            })
        }
        return Object.assign(acc, {
            [nodeType]: new UixNode(
                null,
                nodeTypeMap[nodeType as keyof typeof nodeTypeMap],
                nodeKeyOrKeys
            )
        })
    }, {} as {
        [Type in keyof typeof nodeTypeMap]: typeof nodeTypeMap[Type] extends typeof nodeTypeMap[keyof typeof nodeTypeMap]['relationshipTypeSet'][number]['toNodeType']
        ? (typeof nodeTypeMap[keyof typeof nodeTypeMap]['relationshipTypeSet'][number] & { relationshipClass: 'Set' }) extends RelationshipType<any, infer FromNodeType, any, infer ToNodeType, any>
        ? typeof nodeTypeMap[Type] extends ToNodeType
        ? UixNode<null, typeof nodeTypeMap[Type]>[]
        : UixNode<null, typeof nodeTypeMap[Type]>
        : never
        : UixNode<null, typeof nodeTypeMap['Root']>
    })
    return uixNodes
}

const ProfilePage = () => {
    const nodes = useUix()
    const userNode = nodes.User[0]
    userNode.nodeKey
    const { data } = useNode({
        node: userNode,
        selector: () => { }
    })

    return (
        <div>
            <span>{userNode.data} </span>
            < input value={profileNode.draft.name} onChange={(e) => profileNode.draft.update(draft => {
                draft.name = e.value
            })} />
            < button
                data-loading={profileNode.isSubmitting ? true : null}
                onClick={
                    profileNode.handleSubmit(async () => {
                        await profileNode.draft.save()
                    })
                }
            > Update Profile </button>
            {
                skillNodeSet.map(skillNode => <SkillNode
                    key={skillNode.nodeId}
                    skillNode={skillNode}
                />)
            }
            <input value={skillNodeDraft.description} onChange={(e) => skillNodeDraft.update(draft => {
                draft.description = e.value
            })} />
            < button
                data - loading={skillNodeDraft.isSubmitting ? true : null}
            onClick = {
                skillNodeDraft.handleSubmit(async () => {
                    await skillNodeDraft.save()
                })
            }
        > Create Skill </button >
        </div >
    )
}