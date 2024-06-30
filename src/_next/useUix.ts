useUix(root => {
    root.get('User')
    // Get All
    root.getAll('User').where(user => user.email === 'things@thinair.com').select(user => ({
        email: user.email,
        phoneNumber: user.phoneNumber
    })) as Subset<UserNode>[]
    // Get Profile
    root.get('User').get('Profile') as Result<Package<ProfileNode>, UixErr>
    root.get('User').get('Profile').select(profile => ({
        description: profile.description,
        firstName: profile.firstName,
        lastName: profile.lastName,
    })) as Result<Package<Subset<ProfileNode>>, UixErr>
    // Get Nested
    root.getAll('User').down(user => {
        user.getAll('Profile').select(profile => ({
            description: profile.description,
            firstName: profile.firstName,
            lastName: profile.lastName,
        }))
        user.get('Education')
        user.select(user => ({
            email: user.email,
            phoneNumber: user.phoneNumber
        }))
    }) as Result<Package<{
        user: {
            properties: Subset<UserNode>
            educationNodeSet: Subset<EducationNode>[]
        },
        profile: Subset<ProfileNode>[]
    }>, UixErr>[]

})

type Package<T> = T


useNode(userNode, (node) => ({
    description: node.description,
    firstName: node.firstName,
    lastName: node.lastName,
    email: node.email,
    phoneNumber: node.phoneNumber
}))

    < Button
onclick = {() => {
    node.update({
        data
    })
    node.create('Education', {})
    node.delete()
}}
/>
