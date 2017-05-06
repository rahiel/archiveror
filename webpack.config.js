/* global __dirname */
module.exports = {
    entry: {
        "dist-chromium/archiveror": "./chromium/archiveror.js",
        "dist-chromium/options": "./chromium/options.js"
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
    }
};
