import { createUserDataSet } from "../utils/createUserDataSet";


export const createFemaleHighSchoolGraduateService = async () => await createUserDataSet({
    userNodeData: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        userType: 'Candidate',
        completedOnboardingV2: true,
        phoneNumber: '6035551234',
    },
    profileNodeData: {
        aboutMe: 'Hardworking and dedicated individual with a background in retail and restaurant service.',
        city: 'New York City',
        state: 'NY',
        skills: ['Customer Service', 'Time Management', 'Communication'],
        promptTitle: 'Experienced Service Worker',
        promptSummary: 'Looking for opportunities in the service industry with a focus on customer interaction.',
        resumeName: 'JaneDoe_Resume.pdf',
        resumeUrl: 'http://example.com/JaneDoe_Resume.pdf'
    },
    educationNodeSetData: [{
        school: 'John F. Kennedy High School',
        degree: 'High School Diploma',
        fieldOfStudy: 'Other',
        startDate: '2012-09-01',
        endDate: '2016-06-15',
        description: 'Graduated with honors'
    }],
    workExperienceNodeSetData: [{
        companyName: 'Starbucks',
        title: 'Barista',
        description: 'Prepared beverages and provided excellent customer service.',
        startDate: '2017-05-01',
        endDate: '2019-08-15',
        currentlyHere: false
    },
    {
        companyName: 'Macy\'s',
        title: 'Sales Associate',
        description: 'Assisted customers with purchases and maintained inventory.',
        startDate: '2019-09-01',
        endDate: '2022-03-31',
        currentlyHere: false
    }],
    workPreferenceNodeData: {
        industryPreferenceSet: ['Retail', 'Host and Hostess'],
        workPreferenceSet: ['Onsite'],
        positionTypePreferenceSet: ['Full-Time', 'Part-Time']
    }
});
