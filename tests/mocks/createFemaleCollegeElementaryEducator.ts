import { createUserDataSet } from "../utils/createUserDataSet";


export const createFemaleCollegeElementaryTeacher = async () => await createUserDataSet({
    userNodeData: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        userType: 'Candidate',
        completedOnboardingV2: true,
        phoneNumber: '6035559012',
        profileImageUrl: 'http://example.com/profileImage3.jpg'
    },
    profileNodeData: {
        aboutMe: 'Dedicated educator with a passion for teaching and shaping young minds.',
        city: 'New York City',
        state: 'NY',
        skills: ['Classroom Management', 'Curriculum Development', 'Child Development'],
        promptTitle: 'Elementary School Teacher',
        promptSummary: 'Experienced in developing engaging lesson plans and fostering a positive learning environment.',
        resumeName: 'JaneSmith_Resume.pdf',
        resumeUrl: 'http://example.com/JaneSmith_Resume.pdf'
    },
    educationNodeSetData: [{
        school: 'Columbia University',
        degree: 'Master of Education (M.Ed.)',
        fieldOfStudy: 'English',
        startDate: '2010-09-01',
        endDate: '2014-05-15',
        description: 'Specialized in early childhood education.'
    }],
    workExperienceNodeSetData: [{
        companyName: 'PS 123 Elementary School',
        title: 'Elementary School Teacher',
        description: 'Developed and implemented lesson plans for a diverse group of students.',
        startDate: '2014-08-01',
        endDate: '2020-06-30',
        currentlyHere: false
    },
    {
        companyName: 'PS 456 Elementary School',
        title: 'Lead Teacher',
        description: 'Led a team of teachers in curriculum development and classroom management.',
        startDate: '2020-09-01',
        endDate: '2023-06-30',
        currentlyHere: true
    }],
    workPreferenceNodeData: {
        industryPreferenceSet: ['Education'],
        workPreferenceSet: ['Onsite'],
        positionTypePreferenceSet: ['Full-Time']
    }
})