// Metro config for an Expo app inside an npm-workspaces monorepo.
// Follows the Expo monorepo guide: watch the workspace root so changes to
// packages/shared hot-reload, and resolve modules from both the app's and the
// root's node_modules (hoisted deps live at the root).
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Exclude broken symlink directories from the Metro file watcher on Windows
// (these resolve fine on macOS/EAS builds). Mirrors the ILMYIOS workaround.
config.resolver.blockList = [/node_modules\/\.react-native-worklets-.*\/.*/];

module.exports = config;
