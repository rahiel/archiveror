/* global __dirname */
const webpack = require("webpack");

module.exports = {
    entry: {
        "dist/archiveror": "./src/archiveror.js",
        "dist/options": "./src/options.js",
        "dist/popup": "./src/popup.js",
    },
    output: {
        path: __dirname + "/",
        filename: "[name].js"
    },
    devtool: "source-map",
    module: {
        loaders: [
            {
                loader: "babel-loader",
                test: /\.js$/,
                exclude: /node_modules/
            },
            { test: /\.css$/, loader: "style!css" }
        ]
    },
    plugins: [
        new webpack.optimize.ModuleConcatenationPlugin()
    ]
};
