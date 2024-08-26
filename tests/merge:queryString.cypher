merge (n_t0_i0:User { 
email: "dan.lannan@thinair.cloud"
})
on create 
set n_t0_i0.nodeId = "85fd2926-9fb8-4ad4-8fa0-3e94245bd7a2",
    n_t0_i0 += $n_t0_i0_state,
    n_t0_i0:Node,
    n_t0_i0.createdAt = timestamp(),
    n_t0_i0.updatedAt = timestamp()
on match
set n_t0_i0 += $n_t0_i0_state,
    n_t0_i0:Node,
    n_t0_i0.updatedAt = timestamp()
    
// Merge Next Node
        merge (n_t0_i0_t0_i0:Job { 
            title: "Integration Test Job"
        })
        on create
            set n_t0_i0_t0_i0 += $n_t0_i0_t0_i0_state,
                n_t0_i0_t0_i0.nodeType = "Job",
                n_t0_i0_t0_i0:Node,
                n_t0_i0_t0_i0.createdAt = timestamp(),
                n_t0_i0_t0_i0.updatedAt = timestamp()

        on match
            set n_t0_i0_t0_i0 += apoc.map.removeKey($n_t0_i0_t0_i0_state, 'nodeId'),
                n_t0_i0_t0_i0:Node,
                n_t0_i0_t0_i0.updatedAt = timestamp()

        // Handle Relationship
        
        merge p_t0_i0_t0_i0=(n_t0_i0)
-[r_t0_i0_t0_i0:SWIPED_ON]->
(n_t0_i0_t0_i0)
on create
set r_t0_i0_t0_i0.relationshipType = "SWIPED_ON",
    r_t0_i0_t0_i0 += $r_t0_i0_t0_i0_state,
    r_t0_i0_t0_i0.strength = "weak"
on match
set r_t0_i0_t0_i0 += $r_t0_i0_t0_i0_state,
    r_t0_i0_t0_i0.strength = "weak"
        
// Merge Next Node
        merge (n_t0_i0_t0_i1:Job { 
            title: "Integration Test Job 2"
        })
        on create
            set n_t0_i0_t0_i1 += $n_t0_i0_t0_i1_state,
                n_t0_i0_t0_i1.nodeType = "Job",
                n_t0_i0_t0_i1:Node,
                n_t0_i0_t0_i1.createdAt = timestamp(),
                n_t0_i0_t0_i1.updatedAt = timestamp()

        on match
            set n_t0_i0_t0_i1 += apoc.map.removeKey($n_t0_i0_t0_i1_state, 'nodeId'),
                n_t0_i0_t0_i1:Node,
                n_t0_i0_t0_i1.updatedAt = timestamp()

        // Handle Relationship
        
        merge p_t0_i0_t0_i1=(n_t0_i0)
-[r_t0_i0_t0_i1:SWIPED_ON]->
(n_t0_i0_t0_i1)
on create
set r_t0_i0_t0_i1.relationshipType = "SWIPED_ON",
    r_t0_i0_t0_i1 += $r_t0_i0_t0_i1_state,
    r_t0_i0_t0_i1.strength = "weak"
on match
set r_t0_i0_t0_i1 += $r_t0_i0_t0_i1_state,
    r_t0_i0_t0_i1.strength = "weak"
        
return n_t0_i0, p_t0_i0_t0_i0, r_t0_i0_t0_i0, n_t0_i0_t0_i0, p_t0_i0_t0_i1, r_t0_i0_t0_i1, n_t0_i0_t0_i1