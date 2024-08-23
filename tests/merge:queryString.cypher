// Handle Deletion
match (n_t0_i0:User { 
email: "dan.lannan@thinair.cloud", nodeId: "891b06b4-91a3-4b2d-93b4-2b47398a6c7a"
})
detach delete n_t0_i0
    
return n_t0_i0