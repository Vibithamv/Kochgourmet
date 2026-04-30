module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'react',
          jsxRuntime: 'automatic',
        },
      ],
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
      // Keep reanimated plugin last but with Samsung-safe config
      [
        'react-native-reanimated/plugin',
        {
          relativeSourceLocation: true,
        },
      ],
    ],
  };
};