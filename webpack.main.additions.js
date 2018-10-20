const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const babelOptions = {
    // Explicitly disable babelrc so we don't catch various config
    // in much lower dependencies.
    babelrc: false,
    plugins: [
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-transform-async-to-generator',
        '@babel/plugin-proposal-object-rest-spread'
    ],
    presets: [
        ['@babel/preset-env', {targets: {electron: '3.0.2'}}]
    ]
};

module.exports = {
    devtool: 'cheap-module-source-map',
    module: {
        rules: [
            // Override the *.js defaults from electron-webpack
            // The test/include/exclude must match the defaults exactly for webpack-merge to do the override
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                options: babelOptions
            }
        ]
    },
    optimization: {
        // Use `--env.minify=false` to disable the UglifyJsPlugin instance automatically injected by electron-webpack.
        // Otherwise it will do double-duty with this one.
        minimizer: [new UglifyJsPlugin({
            cache: true,
            parallel: true,
            sourceMap: true // disable this if UglifyJSPlugin takes too long and/or runs out of memory
        })],
        splitChunks: {
            chunks: 'all'
        }
    },
    resolve: {
        symlinks: false
    }
};
