



type NodeTypeSet = 'User' | 'Job' | 'Company'

type NodeType<
  T extends NodeTypeSet, 
  P extends Record<string, any>, 
  C extends Record<string, NodeType<any, any, any>>|undefined = undefined
> = {
  nodeType: T
  props: P
  children?: C
}

type CompanyNodeType = NodeType<'Company', {name: string}>
type JobNodeType = NodeType<'Job', {title: string}, {
  'BELONGS_TO': NodeType<'Company', {name: string}>
}>
type UserNodeType = NodeType<'User', {email: string}, {
  'SWIPED_ON': NodeType<'Job', {title: string}>
}>
type NodeTypeSet = CompanyNodeType | JobNodeType | UserNodeType

const createNode = <
  T extends NodeTypeSet,
>(nodeType: T['nodeType'], props: T['props'], next?: () => void) => ({

})

const thing = createNode('Company', {name: 'ThinAir'}, {
  'BELONGS_TO': createNode('', {title: 'Integration Test Job 2'}, {})
})



