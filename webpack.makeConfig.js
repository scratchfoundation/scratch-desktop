const childProcess = require('child_process');

const electronPath = require('electron');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const isProduction = (process.env.NODE_ENV === 'production');

const electronVersion = childProcess.execSync(`${electronPath} --version`, {encoding: 'utf8'}).trim();
console.log(`Targeting Electron ${electronVersion}`); // eslint-disable-line no-console

const makeConfig = function (options) {
    // eslint-disable-next-line no-console
    console.log(`Module "${options.name}" building in production mode? ${isProduction}`);

    const babelOptions = {
        // Explicitly disable babelrc so we don't catch various config in much lower dependencies.
        babelrc: false,
        plugins: [
            '@babel/plugin-syntax-dynamic-import',
            '@babel/plugin-transform-async-to-generator',
            '@babel/plugin-proposal-object-rest-spread'
        ],
        presets: [
            ['@babel/preset-env', {targets: {electron: electronVersion}}]
        ]
    };

    const sourceFileTest = options.useReact ? /\.jsx?$/ : /\.js$/;
    if (options.useReact) {
        babelOptions.presets = babelOptions.presets.concat('@babel/preset-react');
        babelOptions.plugins.push(['react-intl', {
            messagesDir: './translations/messages/'
        }]);
    }

    return {
        devtool: 'cheap-module-eval-source-map',
        mode: isProduction ? 'production' : 'development',
        module: {
            rules: [
                // Override the *.js defaults from electron-webpack
                // The test/include/exclude must match the defaults exactly for webpack-merge to do the override
                {
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    loader: 'babel-loader',
                    options: babelOptions
                },
                // Add a new rule for the other files we want to run through babel
                {
                    test: sourceFileTest,
                    include: options.babelPaths,
                    loader: 'babel-loader',
                    options: babelOptions
                },
                {
                    test: sourceFileTest,
                    loader: 'source-map-loader',
                    enforce: 'pre'
                }
            ]
        },
        optimization: {
            // Use `--env.minify=false` to disable the UglifyJsPlugin instance automatically injected by
            // electron-webpack. Otherwise it will do double-duty with this one.
            minimizer: isProduction ? [
                new UglifyJsPlugin({
                    cache: true,
                    parallel: true,
                    sourceMap: true, // disable this if UglifyJSPlugin takes too long and/or runs out of memory
                    uglifyOptions: {
                        compress: isProduction ? {} : false,
                        mangle: isProduction
                    }
                })
            ] : []
        },
        plugins: [
            new webpack.SourceMapDevToolPlugin({
                filename: '[file].map'
            })
        ].concat(options.plugins || []),
        resolve: {
            cacheWithContext: false,
            symlinks: false
        }
    };
};

module.exports = makeConfig;
