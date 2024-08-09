match (n_0:User {
    email: "root@root.com", nodeId: "e433b955-6bc7-4447-a272-1b4aef03d9e7"
})
call {
    with n_0
    optional match p_0_0 = (n_0)-[r_0_0:ACCESS_TO]->(n_0_0:Organization)
    return p_0_0, r_0_0, n_0_0
}
call {
    with n_0, p_0_0, r_0_0, n_0_0
    optional match p_0_0_0 = (n_0)-[r_0_0:ACCESS_TO]->(n_0_0:Organization)<-[r_0_0_0:ACCESS_TO]-(n_0_0_0:User)
    return p_0_0_0, r_0_0_0, n_0_0_0
}
call {
    with n_0, p_0_0, r_0_0, n_0_0, p_0_0_0, r_0_0_0, n_0_0_0
    optional match p_0_0_0_0 = (n_0)-[r_0_0:ACCESS_TO]->(n_0_0:Organization)<-[r_0_0_0:ACCESS_TO]-(n_0_0_0:User)-[r_0_0_0_0:SUPERVISOR_TO]->(n_0_0_0_0:User)
    return p_0_0_0_0, r_0_0_0_0, n_0_0_0_0
}
call {
    with n_0, p_0_0, r_0_0, n_0_0, p_0_0_0, r_0_0_0, n_0_0_0, p_0_0_0_0, r_0_0_0_0, n_0_0_0_0
    optional match p_0_0_0_0_0 = (n_0)-[r_0_0:ACCESS_TO]->(n_0_0:Organization)<-[r_0_0_0:ACCESS_TO]-(n_0_0_0:User)-[r_0_0_0_0:SUPERVISOR_TO]->(n_0_0_0_0:User)-[r_0_0_0_0_0:SUPERVISOR_TO]->(n_0_0_0_0_0:User)
    return p_0_0_0_0_0, r_0_0_0_0_0, n_0_0_0_0_0
}
return n_0, p_0_0, r_0_0, n_0_0, p_0_0_0, r_0_0_0, n_0_0_0, p_0_0_0_0, r_0_0_0_0, n_0_0_0_0, p_0_0_0_0_0, r_0_0_0_0_0, n_0_0_0_0_0