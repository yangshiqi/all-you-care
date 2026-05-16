// Empty config — pipeline has no CSS but vitest's underlying vite would
// otherwise walk up to the Next.js app's postcss config and try to load
// `@tailwindcss/postcss`, which isn't installed under pipeline/node_modules.
module.exports = {};
