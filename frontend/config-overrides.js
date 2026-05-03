const { override } = require("customize-cra");
const webpack = require("webpack");

module.exports = override(
  (config) => {
    config.resolve.fallback = {
      assert: require.resolve("assert/"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
      process: require.resolve("process/browser"),
    };
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
        process: "process/browser",
      })
    );
    return config;
  }
);