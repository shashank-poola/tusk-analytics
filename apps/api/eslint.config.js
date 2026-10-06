import { config } from "@workspace/eslint-config/base"

// public/script.js is the built tracker (packages/tracker).
/** @type {import("eslint").Linter.Config} */
export default [...config, { ignores: [".wrangler/**", "public/**"] }]
