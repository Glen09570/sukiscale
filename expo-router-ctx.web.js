// Custom context file for expo-router web
// Resolves the app directory relative to project root
const ctx = require.context(
  './app',
  true,
  /\.tsx$/
);

export { ctx };

