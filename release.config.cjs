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
        }],
        ["@semantic-release/git", {
            assets: ["CHANGELOG.md", "package.json"],
            message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
        }]
    ]
};

