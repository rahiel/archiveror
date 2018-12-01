/* global __dirname */
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
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                options: {
                    cacheDirectory: true,
                }
            },
            { test: /\.css$/, loader: "style!css" }
        ]
    },
};
