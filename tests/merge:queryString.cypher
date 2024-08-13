merge (n_t0_i0:Organization { 
name: "Thin Air1", nodeId: "c036c5d0-4a62-456b-8ffc-69a4d7b5cfc3"
})
on create 
set n_t0_i0.nodeId = "c036c5d0-4a62-456b-8ffc-69a4d7b5cfc3",
    n_t0_i0 += $n_t0_i0_state,
    n_t0_i0:Node,
    n_t0_i0.createdAt = timestamp(),
    n_t0_i0.updatedAt = timestamp()
on match
set n_t0_i0 += $n_t0_i0_state,
    n_t0_i0:Node,
    n_t0_i0.updatedAt = timestamp()
    
// Merge Next Node
merge (n_t0_i0_t0_i0:Project { 
    nodeId: "967f2f12-a19b-4b46-8223-61761912e29c"
})
on create
    set n_t0_i0_t0_i0 += $n_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0.nodeType = "Project",
        n_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0.createdAt = timestamp(),
        n_t0_i0_t0_i0.updatedAt = timestamp()

on match
    set n_t0_i0_t0_i0 += $n_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0.updatedAt = timestamp()

// Handle Relationship

with *
match (n_t0_i0)
<-[r_t0_i0_t0_i0:BELONGS_TO]-
(n_t0_i0_t0_i0)
delete r_t0_i0_t0_i0

return n_t0_i0