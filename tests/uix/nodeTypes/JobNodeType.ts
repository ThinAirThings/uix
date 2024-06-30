

import { defineNodeType } from '@thinairthings/uix';
import { z } from 'zod';

export const JobNodeType = defineNodeType('Job',
    z.object({
        companyName: z.string().transform((val) => val === 'Bandana' ? 'Hirebird' : val),
        description: z.string(),
        title: z.string().describe('Job Title'),
        location: z.string().catch('New York, NY'),
        workLocationType: z.enum(['Remote', 'On-Site', 'Hybrid']).catch('On-Site'),
        skills: z.string().array().describe('Skills Required to do this job. Interpret these as best as you can! They will not be included in the image information. Limit the length to 1-2 words, 3 at the most.'),
        jobSpecificTasks: z.string().array().describe('Specific tasks that the job entails, make sure it is less than 20 words (preferably 10-15), and limit it to 5-10 total.').optional(),
        payPeriod: z.enum(['Hourly', 'Monthly', 'Yearly', 'Unspecified']).catch('Unspecified'),
        salaryLow: z.number().describe('Low end of salary range').catch(-1),
        salaryHigh: z.number().describe('High end of salary range').catch(-1),
        address: z.string().catch('New York, NY'),
        posted: z.string().describe(`When the job was posted. If the job was posted 30 or more days ago, set this to old.`).catch('Recently'),
        hourlyRate: z.string().catch('Unspecified'),
        companyOverview: z.string().optional(),
        benefits: z.string().array().catch([]),
        positionType: z.enum(['Full-Time', 'Part-Time', 'Contract', 'Internship']).catch('Full-Time'),
        estimatedTaxes: z.number().catch(-1),
        latitude: z.number().catch(40.7127281),
        longitude: z.number().catch(-74.0060152),
        jobFunction: z.enum([
            "Accounting and Finance",
            "Administration and Coordination",
            "Architecture and Engineering",
            "Arts and Sports",
            "Customer Service",
            "Education and Training",
            "General Services",
            "Health and Medical",
            "Hospitality and Tourism",
            "Human Resources",
            "IT and Software",
            "Legal",
            "Management and Consultancy",
            "Manufacturing and Production",
            "Media and Creatives",
            "Public Service and NGOs",
            "Safety and Security",
            "Sales and Marketing",
            "Sciences",
            "Supply Chain",
            "Writing and Content"
        ]).describe('The function of the job, infer it if necessary.').catch('General Services'),
        linkToJob: z.string().describe('Link to the job posting, found in props.pageProps.posting.appLink').refine(val => val !== 'https://click.appcast.io/track/jmwhpbs?cs=q8x&exch=16&jg=7tii&bid=l9SLMPEXYLdBoHOtC5o-8g==' && !val.toLowerCase().includes('bandana'), {
            message: 'This link is not valid because bandana is gay'
        }),
        jobLevel: z.enum(['No Experience', '1 - 5 Years', '6 - 10 Years', 'More than 10 Years', 'Unspecified']).describe('Years of experience required, infer it if necessary.').catch('Unspecified'),
        educationRequired: z.enum(['Less Than High School', 'High School', 'Associate\'s Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'Doctoral or Professional Degree']).describe('The level of schooling required for the job. Do not infer if it is not explicit.').catch('Less Than High School'),
        isValid: z.boolean().catch(true).describe('Set this to false if the salary (low or high) is more than $50 an hour (explicitly stated, not calculated) or more than $100,000 a year (explicitly stated, not calculated)')

    }))
    .definePropertyVector(['companyName', 'companyOverview', 'description', 'title', 'address', 'location'])