import _ from "lodash"



const mergeOutput = {
    firstName: 'Dan',
    createdAt: 1723638084923,
    nodeType: 'User',
    nodeId: 'b00aa499-980d-4230-aab0-24b153204901',
    email: 'dan.lannan@thinair.cloud',
    updatedAt: 1723668185761,
    '-SWIPED_ON->Job': {
      '19ada2ed-d4de-462b-9269-1bd1d12a1e9b': {
        relationshipType: 'SWIPED_ON',
        strength: 'weak',
        createdAt: 1723667080295,
        companyName: 'Acme',
        description: 'Do stuff',
        nodeType: 'Job',
        title: 'Job 1',
        nodeId: '19ada2ed-d4de-462b-9269-1bd1d12a1e9b',
        updatedAt: 1723668185761
      },
      '1cfc3893-6460-4cb4-bdf8-3ab7dcc89935': {
        relationshipType: 'SWIPED_ON',
        strength: 'weak',
        createdAt: 1723667002883,
        companyName: 'Acme',
        description: 'Do stuff',
        nodeType: 'Job',
        title: 'Job 1',
        nodeId: '1cfc3893-6460-4cb4-bdf8-3ab7dcc89935',
        updatedAt: 1723668185761
      }
    }
  }
const data = {
    createdAt: 1723638084923,
    firstName: 'Dan',
    nodeType: 'User',
    nodeId: 'b00aa499-980d-4230-aab0-24b153204901',
    email: 'dan.lannan@thinair.cloud',
    updatedAt: 1723668184734,
    '-SWIPED_ON->Job': {
      '19ada2ed-d4de-462b-9269-1bd1d12a1e9b': {
        fromNodeId: 'b00aa499-980d-4230-aab0-24b153204901',
        fromNodeType: 'User',
        relationshipType: 'SWIPED_ON',
        strength: 'weak',
        createdAt: 1723667080295,
        companyName: 'Acme',
        description: 'Do stuff',
        nodeType: 'Job',
        title: 'Job 1',
        nodeId: '19ada2ed-d4de-462b-9269-1bd1d12a1e9b',
        updatedAt: 1723667843964
      },
      '1cfc3893-6460-4cb4-bdf8-3ab7dcc89935': {
        fromNodeId: 'b00aa499-980d-4230-aab0-24b153204901',
        fromNodeType: 'User',
        relationshipType: 'SWIPED_ON',
        strength: 'weak',
        createdAt: 1723667002883,
        companyName: 'Acme',
        description: 'Do stuff',
        nodeType: 'Job',
        title: 'Job 1',
        nodeId: '1cfc3893-6460-4cb4-bdf8-3ab7dcc89935',
        updatedAt: 1723667843964
      }
    }
  }
const yesOrNo = _.isEqualWith(mergeOutput, data, (objValue, othValue, key) => {
    console.log(key, objValue, othValue)
    if (key === 'updatedAt' || key==='fromNodeId' || key === 'fromNodeType') {
        return true
    }
})
console.log(yesOrNo) // true
