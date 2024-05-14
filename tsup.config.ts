import { defineConfig } from "tsup";


const baseOptions = {
    sourcemap: true,
    clean: true,
    shims: true,
    dts: true,
    format: ["cjs", 'esm'],
} as Partial<Parameters<typeof defineConfig>[0]>;

export default defineConfig([{
    entry: {
        index: "src/index.ts",
    },
    ...baseOptions
}, {
    entry: { "neo4j/index": "src/index.neo4j.ts" },
    ...baseOptions
}, {
    entry: { "nextjs/index": "src/index.nextjs.ts" },
    ...baseOptions,
    banner: { js: `'use server'` }
}, {
    entry: { "react/index": "src/index.react.ts" },
    ...baseOptions
}]);
