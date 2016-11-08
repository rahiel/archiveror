module.exports = {
    entry: {
        "dist-chromium/archiveror": "./chromium/archiveror.js",
        "dist-chromium/options": "./chromium/options.js"
    },
    output: {
        path: "./",
        filename: "[name].js"
    },
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
