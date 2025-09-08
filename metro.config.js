const path = require("node:path");
const {getDefaultConfig} = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.extraNodeModules = {
    ...defaultConfig.resolver.extraNodeModules,
    // Map Node-style imports to local shims that re-export browser polyfills
    'node:events': path.resolve(__dirname, 'shims/node_events.js'),
    events: path.resolve(__dirname, 'shims/node_events.js'),
    'node:zlib': path.resolve(__dirname, 'shims/node_zlib.js'),
    zlib: path.resolve(__dirname, 'shims/node_zlib.js'),
    'node:util': path.resolve(__dirname, 'shims/node_util.js'),
    util: path.resolve(__dirname, 'shims/node_util.js'),
    'node:stream': path.resolve(__dirname, 'shims/node_stream.js'),
    stream: path.resolve(__dirname, 'shims/node_stream.js'),
    'node:buffer': path.resolve(__dirname, 'shims/node_buffer.js'),
    buffer: path.resolve(__dirname, 'shims/node_buffer.js'),
    'node:http': path.resolve(__dirname, 'shims/node_http.js'),
    http: path.resolve(__dirname, 'shims/node_http.js'),
    'node:https': path.resolve(__dirname, 'shims/node_https.js'),
    https: path.resolve(__dirname, 'shims/node_https.js'),
    'node:crypto': path.resolve(__dirname, 'shims/node_crypto.js'),
    crypto: path.resolve(__dirname, 'shims/node_crypto.js'),
    'node:net': path.resolve(__dirname, 'shims/node_net.js'),
    net: path.resolve(__dirname, 'shims/node_net.js'),
    'node:tls': path.resolve(__dirname, 'shims/node_tls.js'),
    tls: path.resolve(__dirname, 'shims/node_tls.js'),
    ws: path.resolve(__dirname, 'shims/ws.js'),
    'node:url': path.resolve(__dirname, 'shims/node_url.js'),
    url: path.resolve(__dirname, 'shims/node_url.js'),
    'randombytes': path.resolve(__dirname, 'shims/randombytes.js'),
};

const withStorybook = require("@storybook/react-native/metro/withStorybook");

module.exports = withStorybook(defaultConfig, {
    enabled: process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === "true",
    configPath: path.resolve(__dirname, "./.rnstorybook"),
    onDisabledRemoveStorybook: true,
});
