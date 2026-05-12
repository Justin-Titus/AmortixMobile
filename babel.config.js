module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Temporarily disabled to prevent cyclic serialization crashes
      // 'react-native-reanimated/plugin',
    ],
  };
};
