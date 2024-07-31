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
    detach delete dn_t0_i0_t
}
// ---Handle Merge---
with *  // <--- Ensure necessary variables are included

merge p_t0_i0_t0_i0=(n_t0_i0)
-[r_t0_i0_t0_i0:ACCESS_TO]->
(n_t0_i0_t0_i0:Organization { 
    name: "Thin Air"
})
on create
    set n_t0_i0_t0_i0.nodeId = "dce23159-ab8f-48aa-8e2d-662e6034c60f",
        n_t0_i0_t0_i0 += $n_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0.nodeType = "Organization",
        n_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0.createdAt = timestamp(),
        n_t0_i0_t0_i0.updatedAt = timestamp(),
        r_t0_i0_t0_i0.relationshipType = "ACCESS_TO",
        r_t0_i0_t0_i0 += $r_t0_i0_t0_i0_state
on match
    set n_t0_i0_t0_i0 += $n_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0.updatedAt = timestamp(),
        r_t0_i0_t0_i0 += $r_t0_i0_t0_i0_state 
// ---Handle Deletion--- (Node need to handle limit here as well)
with *
call {
    with *  // <--- Ensure necessary variables are included
    match (n_t0_i0_t0_i0)
    <-[dr_t0_i0_t0_i0:BELONGS_TO]-
    (dn_t0_i0_t0_i0_t:Project)
    where not dn_t0_i0_t0_i0_t.nodeId in $dn_t0_i0_t0_i0_t_relatedNodeIdSet
    detach delete dn_t0_i0_t0_i0_t
}
// ---Handle Merge---
with *  // <--- Ensure necessary variables are included

return n_t0_i0, p_t0_i0_t0_i0, r_t0_i0_t0_i0, n_t0_i0_t0_i0