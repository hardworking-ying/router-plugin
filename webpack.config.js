const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const RouteBuilder = require("./routeBuilder");

module.exports = {
  entry: path.join(__dirname, "src", "index.js"),
  output: { path: path.join(__dirname, "build"), filename: "index.bundle.js" },
  mode: process.env.NODE_ENV || "development",
  resolve: { modules: [path.resolve(__dirname, "src"), "node_modules"] },
  devServer: { 
    port: 5000,
    hot: true,
    open: true,
    historyApiFallback: true,
  },
  module: {
    rules: [
      { 
        test: /\.(js|jsx)$/, 
        exclude: /node_modules/, 
        use: ["babel-loader"] 
      },
      {
        test: /\.(css|scss)$/,
        use: ["style-loader", "css-loader"],
      },
      { 
        test: /\.(jpg|jpeg|png|gif|mp3|svg)$/,
        use: ["file-loader"] 
      },
      {
        test: /router\.jsx$/,
        use: {
          loader: path.resolve(__dirname, 'router-loader.js'),
          options: {
            entry: path.join(__dirname, "src/page"),
            suffix: /.jsx$/,
          }
        }
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "index.html"),
    }),
    // new RouteBuilder({
    //   entry: path.join(__dirname, "src/page"),
    //   suffix: /.jsx$/,
    //   output: path.join(__dirname, "src/base/router.jsx"),
    // }),
  ],
};
