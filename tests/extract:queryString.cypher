match (n_0:Company {
    name: "Hirebird"
})
call {
    with n_0
    optional match p_0_0 = (n_0)<-[r_0_0:BELONGS_TO]-(n_0_0:Job)
    return p_0_0, r_0_0, n_0_0
}
call {
    with n_0, p_0_0, r_0_0, n_0_0
    optional match p_0_0_0 = (n_0)<-[r_0_0:BELONGS_TO]-(n_0_0:Job)<-[r_0_0_0:SWIPED_ON]-(n_0_0_0:User)
    return p_0_0_0, r_0_0_0, n_0_0_0
}
return n_0, collect(p_0_0_0) as pathSet