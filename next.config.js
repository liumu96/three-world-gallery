/** @type {import('next').NextConfig} */
const webpack = require("webpack");
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ["raw-loader", "glslify-loader"],
    });
    config.plugins.push(
      new webpack.ProvidePlugin({
        THREE: "three",
      })
    );

    return config;
  },
};

module.exports = nextConfig;
