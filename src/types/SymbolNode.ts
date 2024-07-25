

type Inc<N extends number, T extends readonly any[] = []> = T["length"] extends N ? [...T, any]["length"] : Inc<N, [...T, any]>;
type Dec<N extends number, T extends any[] = []> = T["length"] extends N ? T["length"] : Dec<N, [any, ...T]>;

type AnySymbolNode = SymbolNode<any, any>
type AnySymbolNodeSet = readonly AnySymbolNode[]
type AnySubgraph = Subgraph<any, any>
export class Subgraph<
    Idxy extends `n_${number}_${number}`,
    NodeSet extends AnySymbolNodeSet
>{
    private constructor(
        public idxy: Idxy,
        public nodeSet: NodeSet
    ){}
    addNode<
        Type extends string,
    >(
        nodeType: Type,
    ){
        const nextHopIdxy = this.idxy.split('_')
            .map((val, idx) => idx === 2 ? val+1 : val)
            .join('_') as (Idxy extends `n_${infer Idx extends number}_${infer Idy extends number}`? `n_${Idx}_${Inc<Idy>}` : never)
        const newSubgraph = new Subgraph(
            nextHopIdxy,
            [
            ...this.nodeSet, 
            new SymbolNode(
                nodeType, 
                nextHopIdxy,
            )
        ] as const)
        return newSubgraph
    }
    root(){
        const nextPathIdxy = this.idxy.split('_')
            .map((val, idx) => idx === 1 ? val+1 : val)
            .join('_') as (Idxy extends `n_${infer Idx extends number}_${number}`? `n_${Inc<Idx>}_${0}` : never)
        return new Subgraph(nextPathIdxy, [...this.nodeSet] as const)
    }
    static create(){
        return new Subgraph('n_0_0', [new RootSymbolNode()] as const)
    }
}
export class SymbolNode<
    Type extends string,
    NodeIndex extends `n_${number}_${number}`,
>{
    constructor(
        public nodeType: Type,
        public nodeIndex: NodeIndex,
    ){}
}
export class RootSymbolNode extends SymbolNode<'Root', 'n_0_0'>{
    constructor(){
        super('Root', 'n_0_0')
    }
}

const subgraph = Subgraph.create()
    .addNode('Organization')
    .addNode('Project')
    .addNode('Task')
    .root()
    .addNode('Message')
    .addNode('User')
    .root()
    .addNode('Chat')
    .addNode('Message')
const next = subgraph.nodeSet[6].nodeIndex


type NodePath<X extends number=0, Y extends number = 1> = `n_${X}_${Y}` extends typeof subgraph.nodeSet[number]['nodeIndex'] 
    ? ({
        [NodeTypeAtDepth in (typeof subgraph.nodeSet[number] & {nodeIndex: `n_${X}_${Y}`})['nodeType']]: NodePath<X, Inc<Y>>
    })
    : null

type NodeTree<X extends number = 0 > = NodePath & (`n_${X}_${1}` extends typeof subgraph.nodeSet[number]['nodeIndex']
    ? NodePath<X> & NodeTree<Inc<X>> 
    : unknown
)
type Branch1 = NodeTree


// type Branch2 = NodePath<1>['Message']
// type NodeTree<X extends 0=0, Y extends number = 1> = (
//     ({
//         [NodeTypeAtDepth in {
//             [K in typeof subgraph.nodeSet[number]['nodeIndex']]: K extends `n_${number}_${Y}` ? (typeof subgraph.nodeSet[number] & {nodeIndex: K})['nodeType'] : never
//         }[typeof subgraph.nodeSet[number]['nodeIndex']]
//         ]: (typeof subgraph.nodeSet[number] & {nodeType: NodeTypeAtDepth})['nodeIndex'] extends `n_${X}_${Y}`
//     })
// ) 



// type NodeTree<X extends number = 0> = 
// type Branch1 = NodeTree['Organization']['']
// type Branch2 = NodeTree['Message']['']
// type Branch3 = NodeTree['']['Message']



// const rootNode = new RootSymbolNode()
//     .addChildNode('Organization')
//     .addChildNode('Project')
//     .addChildNode('Message')

// const thing = rootNode.childNodeSet[2]
// const rootNodeRef = thing.rootNode.childNodeSet[2]
// const thingIndex = thing.nodeIndex
// const newthing = thing.addChildNode('User')
// const newThingChild = thing.childNodeSet[0]





// const child1 = thing.childNodeSet[2].nodeIndex
// const child3 = rootNode.childNodeSet[2].nodeIndex
// const res = rootNode.childNodeSet[2].childNodeSet


// this.nodeIndex.split('_')
// .map((val, idx) => idx === 2 ? val+1 : val)
// .join('_') as (`n_0_0` extends `n_${infer Idx extends number}_${number}`? `n_${Inc<Idx>}_${Dec<typeof this.childNodeSet['length']>}` : never))