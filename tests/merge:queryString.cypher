merge (n_t0_i0:User { 
email: "dan.lannan@thinair.cloud", nodeId: "eb3f8867-067b-4e07-bb1a-58c181122ed0"
})
on create 
set n_t0_i0.nodeId = "eb3f8867-067b-4e07-bb1a-58c181122ed0",
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
            title: "Integration Test Job 3"
        })
        on create
            set n_t0_i0_t0_i0 += $n_t0_i0_t0_i0_state,
                n_t0_i0_t0_i0.nodeType = "Job",
                n_t0_i0_t0_i0:Node,
                n_t0_i0_t0_i0.createdAt = timestamp(),
                n_t0_i0_t0_i0.updatedAt = timestamp()

        on match
            set n_t0_i0_t0_i0 += $n_t0_i0_t0_i0_state,
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
            title: "Integration Test Job"
        })
        on create
            set n_t0_i0_t0_i1 += $n_t0_i0_t0_i1_state,
                n_t0_i0_t0_i1.nodeType = "Job",
                n_t0_i0_t0_i1:Node,
                n_t0_i0_t0_i1.createdAt = timestamp(),
                n_t0_i0_t0_i1.updatedAt = timestamp()

        on match
            set n_t0_i0_t0_i1 += $n_t0_i0_t0_i1_state,
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
        
// Merge Next Node
        merge (n_t0_i0_t0_i2:Job { 
            title: "Integration Test Job 3"
        })
        on create
            set n_t0_i0_t0_i2 += $n_t0_i0_t0_i2_state,
                n_t0_i0_t0_i2.nodeType = "Job",
                n_t0_i0_t0_i2:Node,
                n_t0_i0_t0_i2.createdAt = timestamp(),
                n_t0_i0_t0_i2.updatedAt = timestamp()

        on match
            set n_t0_i0_t0_i2 += $n_t0_i0_t0_i2_state,
                n_t0_i0_t0_i2:Node,
                n_t0_i0_t0_i2.updatedAt = timestamp()

        // Handle Relationship
        
        merge p_t0_i0_t0_i2=(n_t0_i0)
-[r_t0_i0_t0_i2:SWIPED_ON]->
(n_t0_i0_t0_i2)
on create
set r_t0_i0_t0_i2.relationshipType = "SWIPED_ON",
    r_t0_i0_t0_i2 += $r_t0_i0_t0_i2_state,
    r_t0_i0_t0_i2.strength = "weak"
on match
set r_t0_i0_t0_i2 += $r_t0_i0_t0_i2_state,
    r_t0_i0_t0_i2.strength = "weak"
        
return n_t0_i0, p_t0_i0_t0_i0, r_t0_i0_t0_i0, n_t0_i0_t0_i0, p_t0_i0_t0_i1, r_t0_i0_t0_i1, n_t0_i0_t0_i1, p_t0_i0_t0_i2, r_t0_i0_t0_i2, n_t0_i0_t0_i2