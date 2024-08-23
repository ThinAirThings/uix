import { produce } from "immer";
import { test } from "vitest";


test('Query path test', async () => {
    const thing = {
        nodeId: 'l2',
        l3: {
            nodeId: 'l3',
            val: "hello"
        }
    }
    const data = {
        nodeId: 'root',
        l1: {
            nodeId: 'l1',
            l2: {
                nodeId: 'l2',
                l3: {
                    nodeId: 'l3',
                    val: "hello"
                }
            }
        }
    }
    const findAndReplace = (node: any) => {
        console.log(node.nodeId)
        if (node.nodeId === thing.nodeId) {
            Object.assign(node, thing)
            console.log("Found")
            return
        }
        Object.entries(node).filter(([key]) => key !== 'nodeId').map(([key, val]) => {
            findAndReplace(val)
        })
    }
    const output = produce(data, (draft) => {
        findAndReplace(draft)
    })
    console.log("SAME!", output === data)
    console.log(JSON.stringify(output, null, 2))
})