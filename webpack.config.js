var webpack = require("webpack");
var path = require("path");
module.exports = {
  entry: {
    app: ["./src/App.js"]
  },
  output: {
    path: path.resolve(__dirname, "build"),
    publicPath: "/assets/",
    filename: "comment-editor.js"
  },
  externals: {
    "jquery": "jQuery"
  },
  plugins: process.env.NODE_ENV !== "production"? [] : [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin()
  ]
};
