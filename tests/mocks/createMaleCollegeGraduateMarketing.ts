import { createUserDataSet } from "../utils/createUserDataSet";


export const createMaleCollegeGraduateMarketing = async () => await createUserDataSet({
    userNodeData: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        userType: 'Candidate',
        completedOnboardingV2: true,
        phoneNumber: '6035555678',
        profileImageUrl: 'http://example.com/profileImage2.jpg'
    },
    profileNodeData: {
        aboutMe: 'Creative and strategic marketer with a passion for social media and copywriting.',
        city: 'New York City',
        state: 'NY',
        skills: ['Social Media Management', 'Copywriting', 'SEO'],
        promptTitle: 'Marketing Specialist',
        promptSummary: 'Experienced in creating and executing marketing campaigns.',
        resumeName: 'JohnDoe_Resume.pdf',
        resumeUrl: 'http://example.com/JohnDoe_Resume.pdf'
    },
    educationNodeSetData: [{
        school: 'New York University',
        degree: 'Bachelor of Arts (B.A.)',
        fieldOfStudy: 'Marketing',
        startDate: '2014-09-01',
        endDate: '2018-05-15',
        description: 'Focused on digital marketing and advertising.'
    }],
    workExperienceNodeSetData: [{
        companyName: 'BuzzFeed',
        title: 'Social Media Manager',
        description: 'Managed social media channels and increased engagement.',
        startDate: '2018-06-01',
        endDate: '2020-11-30',
        currentlyHere: false
    }, {
        companyName: 'Freelance',
        title: 'Copywriter',
        description: 'Created copy for various clients in different industries.',
        startDate: '2021-01-01',
        endDate: '2023-06-30',
        currentlyHere: true
    }],
    workPreferenceNodeData: {
        industryPreferenceSet: ['Sales and Marketing', 'Customer Service'],
        workPreferenceSet: ['Remote', 'Hybrid'],
        positionTypePreferenceSet: ['Full-Time', 'Contract']
    }
});
