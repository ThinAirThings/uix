merge (n_t0_i0:User { 
    email: "dan.lannan@thinair.cloud"
})
on create 
    set n_t0_i0.nodeId = "718fd0e9-736b-45ed-a127-8b642e55070c",
        n_t0_i0 += $n_t0_i0_state,
        n_t0_i0:Node,
        n_t0_i0.createdAt = timestamp(),
        n_t0_i0.updatedAt = timestamp()
on match
    set n_t0_i0 += $n_t0_i0_state,
        n_t0_i0:Node,
        n_t0_i0.updatedAt = timestamp() 
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

return n_t0_i0, p_t0_i0_t0_i0, r_t0_i0_t0_i0, n_t0_i0_t0_i0