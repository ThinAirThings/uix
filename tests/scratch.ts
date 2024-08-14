import { find } from "lodash"



const variableList = [
    'n_0', 
    'p_0_0', 
    'r_0_0', 
    'n_0_0', 
    'p_0_0_0', 
    'r_0_0_0', 
    'n_0_0_0', 
    'p_0_0_0_0', 
    'r_0_0_0_0', 
    'n_0_0_0_0', 
    'p_0_0_0_0_0', 
    'r_0_0_0_0_0', 
    'n_0_0_0_0_0', 
    'p_0_0_0_0_0_0', 
    'r_0_0_0_0_0_0', 
    'n_0_0_0_0_0_0',
    'n_0_1',
    'p_0_1',
    'r_0_1',
    'n_0_1_0',
    'p_0_1_0',
    'r_0_1_0',
    'n_0_1_0_0',
    'p_0_1_0_0',
    'r_0_1_0_0',
    'n_0_1_1',
    'p_0_1_1',
    'r_0_1_1',
    'n_0_1_1_0',
    'p_0_1_1_0',
    'r_0_1_1_0',
]
const filteredVariableList = variableList.filter(v => v.includes('n'))
const findLongestPaths = (variableList: string[], paths: string[]=[]) => {
    if (variableList.length < 2  ) {
        paths.push(variableList[0])
        return
    }
    if (variableList[1].split('_').length > variableList[0].split('_').length) {
        findLongestPaths(variableList.slice(1), paths)
    } else {
        paths.push(variableList[0])
        findLongestPaths(variableList.slice(1), paths)
    }
    return paths
}
console.log(findLongestPaths(filteredVariableList))
