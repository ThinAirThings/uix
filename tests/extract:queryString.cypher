match (n_0:User {
    email: "dan.lannan@thinair.cloud"
})
call {
    with n_0
    optional match p_0_0 = (n_0)-[r_0_0:SWIPED_ON]->(n_0_0:Job)
    return p_0_0, r_0_0, n_0_0
}
with n_0 , collect(p_0_0) as p_0
return n_0 , p_0 as pathSet