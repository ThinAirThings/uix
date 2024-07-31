merge (n_t0_i0:Organization { 
    name: "Thin Air", nodeId: "91805c09-fbe5-4cf0-a228-00efd4c84d38"
})
on create 
    set n_t0_i0.nodeId = "91805c09-fbe5-4cf0-a228-00efd4c84d38",
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
    <-[dr_t0_i0:ACCESS_TO]-
    (dn_t0_i0_t:User)
    where not dn_t0_i0_t.nodeId in $dn_t0_i0_t_relatedNodeIdSet
    delete dr_t0_i0
    
    // Check for deletion of node
    
}
// ---Handle Merge---
with *  // <--- Ensure necessary variables are included

// Merge Next Node
merge (n_t0_i0_t0_i0:User { 
    email: "dan.lannan@thinair.cloud"
})
on create
    set n_t0_i0_t0_i0 += $n_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0.nodeType = "User",
        n_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0.createdAt = timestamp(),
        n_t0_i0_t0_i0.updatedAt = timestamp()

on match
    set n_t0_i0_t0_i0 += $n_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0.updatedAt = timestamp()

// Merge Relationship
merge p_t0_i0_t0_i0=(n_t0_i0)
<-[r_t0_i0_t0_i0:ACCESS_TO]-
(n_t0_i0_t0_i0)
on create
    set r_t0_i0_t0_i0.relationshipType = "ACCESS_TO",
        r_t0_i0_t0_i0 += $r_t0_i0_t0_i0_state,
        r_t0_i0_t0_i0.strength = "weak"
on match
    set r_t0_i0_t0_i0 += $r_t0_i0_t0_i0_state,
        r_t0_i0_t0_i0.strength = "weak"

return n_t0_i0, p_t0_i0_t0_i0, r_t0_i0_t0_i0, n_t0_i0_t0_i0