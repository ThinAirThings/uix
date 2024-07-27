merge (n_t0_i0:User { nodeId: "9a7c44e4-ef31-425a-a908-d8fbab6754b1"})
on create 
    set n_t0_i0 += $n_t0_i0_state,
        n_t0_i0:Node,
        n_t0_i0.createdAt = timestamp(),
        n_t0_i0.updatedAt = timestamp()
on match
    set n_t0_i0 += $n_t0_i0_state,
        n_t0_i0:Node,
        n_t0_i0.updatedAt = timestamp() 
merge (n_t0_i0)-[r_t0_i0_t0_i0:ACCESS_TO]->(n_t0_i0_t0_i0:Organization { nodeId: "aebef277-2c0c-482d-87ed-e5d18da31c51"})
on create
    set n_t0_i0_t0_i0 += $n_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0.createdAt = timestamp(),
        n_t0_i0_t0_i0.updatedAt = timestamp()
on match
    set n_t0_i0_t0_i0 += $n_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0.updatedAt = timestamp() 
merge (n_t0_i0_t0_i0)<-[r_t0_i0_t0_i0_t0_i0:BELONGS_TO]-(n_t0_i0_t0_i0_t0_i0:Project { nodeId: "889ea58c-22a2-499d-aa4e-03fd83230e7b"})
on create
    set n_t0_i0_t0_i0_t0_i0 += $n_t0_i0_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0_t0_i0.createdAt = timestamp(),
        n_t0_i0_t0_i0_t0_i0.updatedAt = timestamp()
on match
    set n_t0_i0_t0_i0_t0_i0 += $n_t0_i0_t0_i0_t0_i0_state,
        n_t0_i0_t0_i0_t0_i0:Node,
        n_t0_i0_t0_i0_t0_i0.updatedAt = timestamp() 
merge (n_t0_i0)<-[r_t0_i0_t1_i0:SENT_BY]-(n_t0_i0_t1_i0:Message { nodeId: "5cdc4695-a2d0-4bb8-b05e-6b11fae1766e"})
on create
    set n_t0_i0_t1_i0 += $n_t0_i0_t1_i0_state,
        n_t0_i0_t1_i0:Node,
        n_t0_i0_t1_i0.createdAt = timestamp(),
        n_t0_i0_t1_i0.updatedAt = timestamp()
on match
    set n_t0_i0_t1_i0 += $n_t0_i0_t1_i0_state,
        n_t0_i0_t1_i0:Node,
        n_t0_i0_t1_i0.updatedAt = timestamp() 
merge (n_t0_i0)<-[r_t0_i0_t1_i1:SENT_BY]-(n_t0_i0_t1_i1:Message { nodeId: "a1e4e47e-ba72-42c2-a755-5acbcbf98bb4"})
on create
    set n_t0_i0_t1_i1 += $n_t0_i0_t1_i1_state,
        n_t0_i0_t1_i1:Node,
        n_t0_i0_t1_i1.createdAt = timestamp(),
        n_t0_i0_t1_i1.updatedAt = timestamp()
on match
    set n_t0_i0_t1_i1 += $n_t0_i0_t1_i1_state,
        n_t0_i0_t1_i1:Node,
        n_t0_i0_t1_i1.updatedAt = timestamp() 
return n_t0_i0, n_t0_i0_t0_i0, r_t0_i0_t0_i0, n_t0_i0_t0_i0_t0_i0, r_t0_i0_t0_i0_t0_i0, n_t0_i0_t1_i0, r_t0_i0_t1_i0, n_t0_i0_t1_i1, r_t0_i0_t1_i1