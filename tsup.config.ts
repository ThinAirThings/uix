import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["index.ts"],
    clean: true,
    shims: true,
    dts: true,
    format: ["esm", 'cjs'],
});
