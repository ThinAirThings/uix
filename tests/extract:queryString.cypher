match (n_0:User {
    email: "dan.lannan@thinair.cloud"
})
optional match p_0_0 = (n_0)-[r_0_0:SWIPED_ON]->(n_0_0:Job)

with n_0, p_0_0, r_0_0, n_0_0
order by r_0_0.lastSelected desc

optional match p_0_0_0 = (n_0)-[r_0_0:SWIPED_ON]->(n_0_0:Job)<-[r_0_0_0:POSTED]-(n_0_0_0:User)



optional match p_0_1 = (n_0)-[r_0_1:BELONGS_TO]->(n_0_1:Company)



with n_0 , collect(p_0_0) as p_0, collect(p_0_0_0) as p_1, collect(p_0_1) as p_2
return n_0 , p_0+p_1+p_2 as pathSet