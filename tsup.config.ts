import { defineConfig } from "tsup";


const baseOptions = {
    sourcemap: true,
    clean: true,
    shims: true,
    dts: true,
    format: ["cjs", 'esm'],
    splitting: true,
} as Partial<Parameters<typeof defineConfig>[0]>;

export default defineConfig([{
    entry: {
        index: "src/index.ts",
        "neo4j/index": "src/index.neo4j.ts",
        "nextjs/index": "src/index.nextjs.ts",
        "react/index": "src/index.react.ts"
    },
    ...baseOptions
}]);
