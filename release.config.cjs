require('dotenv').config(); // Ensure environment variables are loaded

module.exports = {
    branches: [
        "main",
        "next",
        {
            name: "beta",
            prerelease: true
        }
    ],
    plugins: [
        ["@semantic-release/commit-analyzer", {
            preset: "angular",
            releaseRules: [
                {
                    type: "docs",
                    release: "patch"
                },
                {
                    type: "build",
                    release: "patch"
                },
                {
                    type: "ci",
                    release: "patch"
                }
            ]
        }],
        "@semantic-release/release-notes-generator",
        "@semantic-release/changelog",
        ["@semantic-release/npm", {
            npmPublish: true,
            access: "public",
            registry: process.env.NPM_REGISTRY_URL || "https://registry.npmjs.org/"
        }],
        "@semantic-release/git"
    ]
};
