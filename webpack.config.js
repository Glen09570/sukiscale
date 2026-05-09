const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Fix expo-router app root for web - add alias first
  if (!config.resolve) config.resolve = {};
  if (!config.resolve.alias) config.resolve.alias = {};
  config.resolve.alias['expo-router/_ctx.web.js'] = path.resolve(__dirname, 'expo-router-ctx.web.js');
  
  // Also add fallback for any other path references
  config.resolve.alias['expo-router/_ctx'] = path.resolve(__dirname, 'expo-router-ctx.web.js');
  
  // Add @/ alias for TypeScript path mapping
  config.resolve.alias['@'] = path.resolve(__dirname);
  
  // Fix nanoid for web (use custom shim directory)
  config.resolve.alias['nanoid'] = path.resolve(__dirname, 'nanoid-shim');
  
  // Fix expo-router app root for web - replace the context file via plugin
  config.plugins.unshift(
    new webpack.NormalModuleReplacementPlugin(
      /expo-router\/_ctx\.web\.js$/,
      path.resolve(__dirname, 'expo-router-ctx.web.js')
    )
  );
  
  // Define EXPO_ROUTER_APP_ROOT for the build
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.EXPO_ROUTER_APP_ROOT': JSON.stringify(path.resolve(__dirname, 'app'))
    })
  );

  // Add WASM support for expo-sqlite
  config.module.rules.push({
    test: /\.wasm$/,
    type: 'asset/resource',
    generator: {
      filename: 'static/wasm/[name].[hash][ext]',
    },
  });
  
  // Resolve .wasm files
  config.resolve.extensions.push('.wasm');
  
  return config;
};
