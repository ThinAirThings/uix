match (n_0:User {
    email: "dan.lannan@thinair.cloud", nodeId: "49298ac9-f9b0-43c9-8751-1244ec29739b"
})
call {
    with n_0
    optional match p_0_0 = (n_0)-[r_0_0:ACCESS_TO]->(n_0_0:Organization)
    return p_0_0, r_0_0, n_0_0
}
call {
    with n_0, p_0_0, r_0_0, n_0_0
    optional match p_0_0_0 = (n_0)-[r_0_0:ACCESS_TO]->(n_0_0:Organization)<-[r_0_0_0:BELONGS_TO]-(n_0_0_0:Project)
    return p_0_0_0, r_0_0_0, n_0_0_0
}
call {
    with n_0, p_0_0, r_0_0, n_0_0, p_0_0_0, r_0_0_0, n_0_0_0
    optional match p_0_0_0_0 = (n_0)-[r_0_0:ACCESS_TO]->(n_0_0:Organization)<-[r_0_0_0:BELONGS_TO]-(n_0_0_0:Project)<-[r_0_0_0_0:ACCESS_TO]-(n_0_0_0_0:User)
    return p_0_0_0_0, r_0_0_0_0, n_0_0_0_0
}
call {
    with n_0, p_0_0, r_0_0, n_0_0, p_0_0_0, r_0_0_0, n_0_0_0, p_0_0_0_0, r_0_0_0_0, n_0_0_0_0
    optional match p_0_1 = (n_0)<-[r_0_1:CONVERSATION_BETWEEN]-(n_0_1:Chat)
    return p_0_1, r_0_1, n_0_1
}
call {
    with n_0, p_0_0, r_0_0, n_0_0, p_0_0_0, r_0_0_0, n_0_0_0, p_0_0_0_0, r_0_0_0_0, n_0_0_0_0, p_0_1, r_0_1, n_0_1
    optional match p_0_1_0 = (n_0)<-[r_0_1:CONVERSATION_BETWEEN]-(n_0_1:Chat)-[r_0_1_0:CONVERSATION_BETWEEN]->(n_0_1_0:User)
    return p_0_1_0, r_0_1_0, n_0_1_0
}
return n_0, p_0_0, r_0_0, n_0_0, p_0_0_0, r_0_0_0, n_0_0_0, p_0_0_0_0, r_0_0_0_0, n_0_0_0_0, p_0_1, r_0_1, n_0_1, p_0_1_0, r_0_1_0, n_0_1_0