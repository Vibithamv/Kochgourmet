// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = [
  "react-native",
  "browser",
  "require",
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-polyfill-globals': require.resolve('react-native-polyfill-globals'),
};

module.exports = config;
