
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
    ParentUixNode extends UixNode<any, any, any> | null,
    ThisNodeType extends AnyNodeType,
    _CollectionType
> {
    constructor(
        public parentUixNode: ParentUixNode,
        public nodeType: ThisNodeType,
        public operationSet: Array<string>,
        public _collectionType: _CollectionType = {
            ...parentUixNode?._collectionType,
        }
    ) { }
    create = async <
        NextType extends ThisNodeType extends NodeType<any, any, any, any, infer RelationshipTypeSet>
        ? RelationshipTypeSet[number]['toNodeType']['type']
        : never
    >(nextType: NextType, nextTypeState: NodeState<typeof nodeTypeMap[NextType]>) => {

    }
    update = async (data: Partial<NodeState<ThisNodeType>>) => {
        return new UixNode(this.parentUixNode, this.nodeType)
    }
    get = async <
        NextType extends ThisNodeType extends NodeType<any, any, any, any, infer RelationshipTypeSet, any>
        ? RelationshipTypeSet[number]['toNodeType']['type']
        : never
    >(
        nextType: NextType
    )
        // : Promise<(ThisNodeType['relationshipTypeSet'][number] & { relationshipClass: 'Set' }) extends RelationshipType<any, any, any, infer ToNodeType, any>
        //     ? typeof nodeTypeMap[NextType] extends ToNodeType
        //     ? UixNode<this, typeof nodeTypeMap[NextType]>[]
        //     : UixNode<this, typeof nodeTypeMap[NextType]>
        //     : never
        // >
        => {

        return new UixNode(
            this,
            nodeTypeMap[nextType],
            this.operationSet.concat([dedent`
                <-[:${this.nodeType.relationshipTypeSet.includes((relationshipType: GenericRelationshipType) =>
                relationshipType.relationshipClass === 'Set'
                && relationshipType.toNodeType.type === nextType
            ) ? `CHILD_TO` : `UNIQUE_TO`}-(${nextType}Node:Node:${nextType}})
            `]),
            {
                [`${this.nodeType}Node`]: this,
                [`${nextType}Node`]: 
            }
        )
    }
}

class RootUixNode extends UixNode<
    null, typeof nodeTypeMap['Root'], {}
> {
    constructor(
        public userNodeKey: NodeKey<typeof nodeTypeMap, 'User'>
    ) {
        super(null, nodeTypeMap.Root, [], {})
    }
    get activeUserNode() {
        return new UixNode(
            this,
            nodeTypeMap['User'],
            this.operationSet.concat([dedent/*cypher*/`
                MATCH (userNode:Node:${this.userNodeKey.nodeType} {nodeId: $nodeId})
            `]), {
            UserNode: this
        })
    }
}

const useUserNodeKey = () => ({ nodeType: 'User', nodeId: '123' }) as NodeKey<typeof nodeTypeMap, 'User'>
export const useUix = <
    Collection,
    Selection = Collection
>({
    collector,
    selector
}: {
    collector: ({ root }: { root: RootUixNode }) => Collection,
    selector?: (collection: Collection) => Selection
}) => {
    const userNodeKey = useUserNodeKey()    // From UixProvider
    collector({
        root: new RootUixNode(userNodeKey)
    })
}

const ProfilePage = () => {
    const { userNode, profileNode, skillNodeSet, skillNodeDraft } = useUix({
        collector: ({ root }) => {
            const userNode = root.activeUserNode
            root.activeUserNode.get('Profile')
            userNode._collectionType['UserNode']
            //** Scratch Block */
            const queryString = dedent/*cypher*/`
                MATCH (userNode:Node:${root.userNodeKey.nodeType} {nodeId: $nodeId})
            `
            //** End Scratch Block */
            const profileNode = userNode.get('Profile')
            //** Scratch Block */
            const queryString2 = dedent/*cypher*/`
                MATCH (userNode:Node:${root.userNodeKey.nodeType} {nodeId: $nodeId})
                <-[:UNIQUE_TO]-(profileNode:Node:${})
            `
            //** End Scratch Block */
            const { profileNode, skillNodeSet } = userNode.get({
                nodeType: 'Profile'
            }).chain(({ profileNode }) => {
                profileNode.get({ nodeType: 'Skill' })
            })
            // OR
            const { skillNodeSet } = profileNode.get({

            })
            const skillNodeDraft = skillNodeSet.createDraft({
                description: 'some default'
            })
            return { firstName, profileNode, skillNodeSet, skillNodeDraft }
        }
    })
    const { data } = useNode({
        node: userNode,
        selector: () => { }
    })

    return (
        <div>
            <span>{userNode.data} </span>
            <input value={profileNode.draft.name} onChange={(e) => profileNode.draft.update(draft => {
                draft.name = e.value
            })} />
            <button
                data-loading={profileNode.isSubmitting ? true : null}
                onClick={profileNode.handleSubmit(async () => {
                    await profileNode.draft.save()
                })}
            >Update Profile</button>
            {skillNodeSet.map(skillNode => <SkillNode
                key={skillNode.nodeId}
                skillNode={skillNode}
            />)}
            <input value={skillNodeDraft.description} onChange={(e) => skillNodeDraft.update(draft => {
                draft.description = e.value
            })} />
            <button
                data-loading={skillNodeDraft.isSubmitting ? true : null}
                onClick={skillNodeDraft.handleSubmit(async () => {
                    await skillNodeDraft.save()
                })}
            >Create Skill</button>
        </div>
    )
}














