


export const testEnvLog = (...logs: Parameters<typeof console.log>) => process.env.TEST_ENV === "true" && console.log(...logs);