

import express, { Request } from "express";
import http, { request } from "http";
import * as dotenv from 'dotenv'
import jwt from 'jsonwebtoken';
import { createServerClient, GetAllCookies } from '@supabase/ssr'

dotenv.config({
    path: `.env.testServer`
})
const PORT = 5000;
const app = express();
app.use(express.json({
    limit: '50mb'
}));
const server = http.createServer(app);

const expressCookiesToSupabaseCookies = (request: Request) => {
    return request.headers.cookie?.split('; ').map(cookie => ({
        name: cookie.split('=')[0],
        value: cookie.split('=')[1],
    }))
}
app.get("*", async (request, response) => {
    const serverClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
            cookies: {
                getAll(){
                    return expressCookiesToSupabaseCookies(request) as any
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                },
            }
        }
    )    
    const {
        data: { user },
    } = await serverClient.auth.getUser();
    console.log(user);
    // const tokenEntries = request.headers.cookie?.split('; ').reduce((tokenEntries, cookie) => {
    //     const [key, value] = cookie.split('=');
    //     if (key.startsWith('sb')) {
    //         tokenEntries[key] = value
    //     }
    //     return tokenEntries;
    // }, {} as Record<`sb-${string}-auth-token.${number}`, string>)
    // if (!tokenEntries) return
    // const token = tokenEntries[`sb-${process.env.SUPABASE_PROJECT_ID!}-auth-token.0`] + tokenEntries[`sb-${process.env.SUPABASE_PROJECT_ID!}-auth-token.1`];
    // const tokenObject = JSON.parse(Buffer.from(token.replace('base64-', ''), 'base64').toString('utf-8')) as {
    //     access_token: string;
    // }
    // const decoded = jwt.verify(tokenObject.access_token, process.env.SUPABASE_JWT_TOKEN! );
    // console.log(decoded);
    response.status(200).send(`You've hit ${request.path}`);
});
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});