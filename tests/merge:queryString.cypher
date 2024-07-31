merge (n_t0_i0:User { 
    email: "dan.lannan@thinair.cloud", nodeId: "af53ff6c-e781-4fe3-be05-2b00162859cf"
})
on create 
    set n_t0_i0.nodeId = "af53ff6c-e781-4fe3-be05-2b00162859cf",
        n_t0_i0 += $n_t0_i0_state,
        n_t0_i0:Node,
        n_t0_i0.createdAt = timestamp(),
        n_t0_i0.updatedAt = timestamp()
on match
    set n_t0_i0 += $n_t0_i0_state,
        n_t0_i0:Node,
        n_t0_i0.updatedAt = timestamp() 
// ---Handle Deletion--- (Node need to handle limit here as well)
with *
call {
    with *  // <--- Ensure necessary variables are included
    match (n_t0_i0)
    -[dr_t0_i0:ACCESS_TO]->
    (dn_t0_i0_t:Organization)
    where not dn_t0_i0_t.nodeId in $dn_t0_i0_t_relatedNodeIdSet
    delete dr_t0_i0
    
    // Check for deletion of node
    
}
// ---Handle Merge---
with *  // <--- Ensure necessary variables are included

// Merge Next Node
merge (n_t0_i0_t0_i0:Organization { 
    name: "Thin Air"
})
on create
    set n_t0_i0_t0_i0 += $n_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0.nodeType = "Organization",
        n_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0.createdAt = timestamp(),
        n_t0_i0_t0_i0.updatedAt = timestamp()

on match
    set n_t0_i0_t0_i0 += $n_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0.updatedAt = timestamp()

// Merge Relationship
merge p_t0_i0_t0_i0=(n_t0_i0)
-[r_t0_i0_t0_i0:ACCESS_TO]->
(n_t0_i0_t0_i0)
on create
    set r_t0_i0_t0_i0.relationshipType = "ACCESS_TO",
        r_t0_i0_t0_i0 += $r_t0_i0_t0_i0_state,
        r_t0_i0_t0_i0.strength = "weak"
on match
    set r_t0_i0_t0_i0 += $r_t0_i0_t0_i0_state,
        r_t0_i0_t0_i0.strength = "weak"

// ---Handle Deletion--- (Node need to handle limit here as well)
with *
call {
    with *  // <--- Ensure necessary variables are included
    match (n_t0_i0_t0_i0)
    <-[dr_t0_i0_t0_i0:BELONGS_TO]-
    (dn_t0_i0_t0_i0_t:Project)
    where not dn_t0_i0_t0_i0_t.nodeId in $dn_t0_i0_t0_i0_t_relatedNodeIdSet
    delete dr_t0_i0_t0_i0
    
    // Check for deletion of node
    with dn_t0_i0_t0_i0_t
optional match (dn_t0_i0_t0_i0_t)-[{strength: "strong"}]->(strongConnectedNode)
with dn_t0_i0_t0_i0_t, count(strongConnectedNode) as strongConnectedNodeCount
where strongConnectedNodeCount < 1
detach delete dn_t0_i0_t0_i0_t
}
// ---Handle Merge---
with *  // <--- Ensure necessary variables are included

// Merge Next Node
merge (n_t0_i0_t0_i0_t0_i0:Project { 
    nodeId: "a75ca514-1d65-4e44-83a7-1e349427a880"
})
on create
    set n_t0_i0_t0_i0_t0_i0 += $n_t0_i0_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0_t0_i0.nodeType = "Project",
        n_t0_i0_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0_t0_i0.createdAt = timestamp(),
        n_t0_i0_t0_i0_t0_i0.updatedAt = timestamp()

on match
    set n_t0_i0_t0_i0_t0_i0 += $n_t0_i0_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0_t0_i0.updatedAt = timestamp()

// Merge Relationship
merge p_t0_i0_t0_i0_t0_i0=(n_t0_i0_t0_i0)
<-[r_t0_i0_t0_i0_t0_i0:BELONGS_TO]-
(n_t0_i0_t0_i0_t0_i0)
on create
    set r_t0_i0_t0_i0_t0_i0.relationshipType = "BELONGS_TO",
        r_t0_i0_t0_i0_t0_i0 += $r_t0_i0_t0_i0_t0_i0_state,
        r_t0_i0_t0_i0_t0_i0.strength = "strong"
on match
    set r_t0_i0_t0_i0_t0_i0 += $r_t0_i0_t0_i0_t0_i0_state,
        r_t0_i0_t0_i0_t0_i0.strength = "strong"

return n_t0_i0, p_t0_i0_t0_i0, r_t0_i0_t0_i0, n_t0_i0_t0_i0, p_t0_i0_t0_i0_t0_i0, r_t0_i0_t0_i0_t0_i0, n_t0_i0_t0_i0_t0_i0