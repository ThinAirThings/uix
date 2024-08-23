'use server'

import { TypeOf, z, ZodObject } from "zod"
// import { openai } from "../libs/openai/openai"
import zodToJsonSchema from "zod-to-json-schema"
import {OpenAI}from 'openai'
import dotenv from 'dotenv'

dotenv.config({
    'path': '.env.test'
})

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY as string})

export const getConstrainedAIOutput = async <
    ReturnSchema extends ZodObject<any>
>({
    model,
    messages,
    returnSchema
}: Pick<
    Parameters<typeof openai.chat.completions.create>[0],
    'model' | 'messages'
> & {
    returnSchema: ReturnSchema
}) => {
    const response = await openai.chat.completions.create({
        model,
        messages,
        tools: [{
            type: 'function',
            function: {
                name: 'fn',
                description: '',
                parameters: zodToJsonSchema(returnSchema),
            },
        }],
        tool_choice: {
            type: 'function',
            function: {
                name: 'fn'
            }
        }
    })

    return JSON.parse(response.choices[0]!.message.tool_calls![0]!.function.arguments) as TypeOf<ReturnSchema>
}


export const industries = [
    'Driver and Delivery',
    'Kitchen Porter',
    'Chef and Cook',
    'Waiters',
    'Host and Hostess',
    'Barista',
    'Bar Staff',
    'Entertainment',
    'Customer Service',
    'Security',
    'Child Care',
    'Office and Admin',
    'Sales and Marketing',
    'Accounting and Finance',
    'Legal',
    'Management',
    'Retail',
    'Warehouse',
    'Events and Promotion',
    'Information Technology',
    'Online Jobs',
    'Writing and Editing',
    'Education',
    'Construction and Trades',
    'Engineering',
    'Manufacturing',
    'Healthcare',
    'Science',
    'Animal Care',
    'Salon and Beauty',
    'Art, Media, Design',
    'Fashion',
    'Sports and Wellness',
    'Other'
] as const

console.log(await getConstrainedAIOutput({
    model: 'gpt-4o-mini',
    'messages': [{
        role: 'system',
        content: "You're an ai that takes a profile and returns a set of industry tags that are relevant to them. Please select as many tags as you see fit from the provided schema."
    }, {
        'role': 'user',
        'content': `
The individual is an accomplished technology professional and entrepreneur with a diverse background in software development and leadership roles. Currently serving as the Chief Technology Officer at Hirebird, a job search platform, they have a strong focus on helping new graduates and entry-level talent find opportunities.

As the founder of Thin Air, they are building the next computer interface, showcasing their innovative mindset and dedication to cutting-edge technology. Their previous role as Systems Director at Blueprint Custom Apparel and Graphics demonstrates their experience in managing systems and operations for over four years.

Their entrepreneurial spirit is further highlighted by their roles as Founder and Engineer at Spacey and BlackBox, where they explored AI-generated software components and developed an infinite canvas-based software development environment. This individual exhibits a strong belief in the potential of new technologies and has a track record of incorporating these advancements into practical, impactful solutions. They are committed to on-site work, indicating a hands-on approach to their projects and leadership.
`}],
    'returnSchema': z.object({
        output: z.enum(industries).array()
    })
}))

