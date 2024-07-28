// tsup.config.ts
import { defineConfig } from "tsup";
import { readdirSync, statSync } from "fs";
import { join, extname, basename } from "path";
function getEntries(dir, baseDir = "") {
  const entries = {};
  const files = readdirSync(dir);
  files.forEach((file) => {
    const fullPath = join(dir, file);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (!/^\(.*\)$/.test(file)) {
        Object.assign(entries, getEntries(fullPath, join(baseDir, file)));
      }
    } else if (stats.isFile() && (file.endsWith(".ts") || file.endsWith(".tsx"))) {
      const relativePath = join(baseDir, basename(file, extname(file)));
      entries[`cli/${relativePath}`] = fullPath;
    }
  });
  return entries;
}
var cliConfig = {
  clean: true,
  shims: true,
  format: ["esm"],
  outDir: "dist",
  tsconfig: "tsconfig.cli.json"
};
var tsup_config_default = defineConfig([
  // CLI
  {
    entry: {
      "cli/cli": "src/app/cli.ts"
    },
    ...cliConfig,
    publicDir: "src/public"
  },
  {
    entry: getEntries("src/app"),
    ...cliConfig
  },
  // Packaging
  {
    entry: {
      "lib/index": "src/index.ts"
    },
    sourcemap: true,
    clean: true,
    shims: true,
    dts: true,
    format: ["esm", "cjs"],
    tsconfig: "tsconfig.lib.json"
  }
]);
export {
  tsup_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL2hvbWUvYWlyY3JhZnQvY3JlYXRlL1RoaW5BaXIvbGlicy91aXgvdHN1cC5jb25maWcudHNcIjtjb25zdCBfX2luamVjdGVkX2Rpcm5hbWVfXyA9IFwiL2hvbWUvYWlyY3JhZnQvY3JlYXRlL1RoaW5BaXIvbGlicy91aXhcIjtjb25zdCBfX2luamVjdGVkX2ltcG9ydF9tZXRhX3VybF9fID0gXCJmaWxlOi8vL2hvbWUvYWlyY3JhZnQvY3JlYXRlL1RoaW5BaXIvbGlicy91aXgvdHN1cC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd0c3VwJztcbmltcG9ydCB7IHJlYWRkaXJTeW5jLCBzdGF0U3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGpvaW4sIHJlbGF0aXZlLCBleHRuYW1lLCBiYXNlbmFtZSB9IGZyb20gJ3BhdGgnO1xuXG5mdW5jdGlvbiBnZXRFbnRyaWVzKGRpcjogc3RyaW5nLCBiYXNlRGlyID0gJycpIHtcbiAgICBjb25zdCBlbnRyaWVzID0ge307XG4gICAgY29uc3QgZmlsZXMgPSByZWFkZGlyU3luYyhkaXIpO1xuXG4gICAgZmlsZXMuZm9yRWFjaCgoZmlsZSkgPT4ge1xuICAgICAgICBjb25zdCBmdWxsUGF0aCA9IGpvaW4oZGlyLCBmaWxlKTtcbiAgICAgICAgY29uc3Qgc3RhdHMgPSBzdGF0U3luYyhmdWxsUGF0aCk7XG5cbiAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBkaXJlY3RvcnkgbmFtZSBpcyB3cmFwcGVkIGluIHBhcmVudGhlc2VzXG4gICAgICAgICAgICBpZiAoIS9eXFwoLipcXCkkLy50ZXN0KGZpbGUpKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihlbnRyaWVzLCBnZXRFbnRyaWVzKGZ1bGxQYXRoLCBqb2luKGJhc2VEaXIsIGZpbGUpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdHMuaXNGaWxlKCkgJiYgKGZpbGUuZW5kc1dpdGgoJy50cycpIHx8IGZpbGUuZW5kc1dpdGgoJy50c3gnKSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IGpvaW4oYmFzZURpciwgYmFzZW5hbWUoZmlsZSwgZXh0bmFtZShmaWxlKSkpO1xuICAgICAgICAgICAgZW50cmllc1tgY2xpLyR7cmVsYXRpdmVQYXRofWBdID0gZnVsbFBhdGg7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBlbnRyaWVzO1xufVxuY29uc3QgY2xpQ29uZmlnID0ge1xuICAgIGNsZWFuOiB0cnVlLFxuICAgIHNoaW1zOiB0cnVlLFxuICAgIGZvcm1hdDogW1wiZXNtXCJdLFxuICAgIG91dERpcjogXCJkaXN0XCIsXG4gICAgdHNjb25maWc6IFwidHNjb25maWcuY2xpLmpzb25cIixcbn0gYXMgUGFydGlhbDxQYXJhbWV0ZXJzPHR5cGVvZiBkZWZpbmVDb25maWc+WzBdPlxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoW1xuICAgIC8vIENMSVxuICAgIHtcbiAgICAgICAgZW50cnk6IHtcbiAgICAgICAgICAgIFwiY2xpL2NsaVwiOiAnc3JjL2FwcC9jbGkudHMnXG4gICAgICAgIH0sXG4gICAgICAgIC4uLmNsaUNvbmZpZyxcbiAgICAgICAgcHVibGljRGlyOiAnc3JjL3B1YmxpYycsXG4gICAgfSwge1xuICAgICAgICBlbnRyeTogZ2V0RW50cmllcygnc3JjL2FwcCcpLFxuICAgICAgICAuLi5jbGlDb25maWcsXG4gICAgfSxcbiAgICAvLyBQYWNrYWdpbmdcbiAgICB7XG4gICAgICAgIGVudHJ5OiB7XG4gICAgICAgICAgICBcImxpYi9pbmRleFwiOiBcInNyYy9pbmRleC50c1wiXG4gICAgICAgIH0sXG4gICAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICAgICAgY2xlYW46IHRydWUsXG4gICAgICAgIHNoaW1zOiB0cnVlLFxuICAgICAgICBkdHM6IHRydWUsXG4gICAgICAgIGZvcm1hdDogW1wiZXNtXCIsICdjanMnXSxcbiAgICAgICAgdHNjb25maWc6IFwidHNjb25maWcubGliLmpzb25cIixcbiAgICB9XG5dKSJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1EsU0FBUyxvQkFBb0I7QUFDN1IsU0FBUyxhQUFhLGdCQUFnQjtBQUN0QyxTQUFTLE1BQWdCLFNBQVMsZ0JBQWdCO0FBRWxELFNBQVMsV0FBVyxLQUFhLFVBQVUsSUFBSTtBQUMzQyxRQUFNLFVBQVUsQ0FBQztBQUNqQixRQUFNLFFBQVEsWUFBWSxHQUFHO0FBRTdCLFFBQU0sUUFBUSxDQUFDLFNBQVM7QUFDcEIsVUFBTSxXQUFXLEtBQUssS0FBSyxJQUFJO0FBQy9CLFVBQU0sUUFBUSxTQUFTLFFBQVE7QUFFL0IsUUFBSSxNQUFNLFlBQVksR0FBRztBQUVyQixVQUFJLENBQUMsV0FBVyxLQUFLLElBQUksR0FBRztBQUN4QixlQUFPLE9BQU8sU0FBUyxXQUFXLFVBQVUsS0FBSyxTQUFTLElBQUksQ0FBQyxDQUFDO0FBQUEsTUFDcEU7QUFBQSxJQUNKLFdBQVcsTUFBTSxPQUFPLE1BQU0sS0FBSyxTQUFTLEtBQUssS0FBSyxLQUFLLFNBQVMsTUFBTSxJQUFJO0FBQzFFLFlBQU0sZUFBZSxLQUFLLFNBQVMsU0FBUyxNQUFNLFFBQVEsSUFBSSxDQUFDLENBQUM7QUFDaEUsY0FBUSxPQUFPLFlBQVksRUFBRSxJQUFJO0FBQUEsSUFDckM7QUFBQSxFQUNKLENBQUM7QUFFRCxTQUFPO0FBQ1g7QUFDQSxJQUFNLFlBQVk7QUFBQSxFQUNkLE9BQU87QUFBQSxFQUNQLE9BQU87QUFBQSxFQUNQLFFBQVEsQ0FBQyxLQUFLO0FBQUEsRUFDZCxRQUFRO0FBQUEsRUFDUixVQUFVO0FBQ2Q7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQTtBQUFBLEVBRXhCO0FBQUEsSUFDSSxPQUFPO0FBQUEsTUFDSCxXQUFXO0FBQUEsSUFDZjtBQUFBLElBQ0EsR0FBRztBQUFBLElBQ0gsV0FBVztBQUFBLEVBQ2Y7QUFBQSxFQUFHO0FBQUEsSUFDQyxPQUFPLFdBQVcsU0FBUztBQUFBLElBQzNCLEdBQUc7QUFBQSxFQUNQO0FBQUE7QUFBQSxFQUVBO0FBQUEsSUFDSSxPQUFPO0FBQUEsTUFDSCxhQUFhO0FBQUEsSUFDakI7QUFBQSxJQUNBLFdBQVc7QUFBQSxJQUNYLE9BQU87QUFBQSxJQUNQLE9BQU87QUFBQSxJQUNQLEtBQUs7QUFBQSxJQUNMLFFBQVEsQ0FBQyxPQUFPLEtBQUs7QUFBQSxJQUNyQixVQUFVO0FBQUEsRUFDZDtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==