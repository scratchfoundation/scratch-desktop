const childProcess = require('child_process');

const electronPath = require('electron');
const webpack = require('webpack');
const merge = require('webpack-merge');

// PostCss
const autoprefixer = require('autoprefixer');
const postcssVars = require('postcss-simple-vars');
const postcssImport = require('postcss-import');

const isProduction = (process.env.NODE_ENV === 'production');

const electronVersion = childProcess.execSync(`${electronPath} --version`, {encoding: 'utf8'}).trim();
console.log(`Targeting Electron ${electronVersion}`); // eslint-disable-line no-console

const makeConfig = function (defaultConfig, options) {
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

    // TODO: consider adjusting these rules instead of discarding them in at least some cases
    if (options.disableDefaultRulesForExtensions) {
        defaultConfig.module.rules = defaultConfig.module.rules.filter(rule => {
            if (!(rule.test instanceof RegExp)) {
                // currently we don't support overriding other kinds of rules
                return true;
            }
            // disable default rules for any file extension listed here
            // we will handle these files in some other way (see below)
            // OR we want to avoid any processing at all (such as with fonts)
            const shouldDisable = options.disableDefaultRulesForExtensions.some(
                ext => rule.test.test(`test.${ext}`)
            );
            if (shouldDisable) {
                console.log(`${options.name}: Discarding electron-webpack default rule for ${rule.test}`);
            }
            return !shouldDisable;
        });
    }

    return merge.smart(defaultConfig, {
        devtool: 'cheap-module-eval-source-map',
        mode: isProduction ? 'production' : 'development',
        module: {
            rules: [
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
                },
                { // coped from scratch-gui
                    test: /\.css$/,
                    use: [{
                        loader: 'style-loader'
                    }, {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            importLoaders: 1,
                            localIdentName: '[name]_[local]_[hash:base64:5]',
                            camelCase: true
                        }
                    }, {
                        loader: 'postcss-loader',
                        options: {
                            ident: 'postcss',
                            plugins: function () {
                                return [
                                    postcssImport,
                                    postcssVars,
                                    autoprefixer
                                ];
                            }
                        }
                    }]
                },
                {
                    test: /\.(svg|png|wav|gif|jpg)$/,
                    loader: 'file-loader',
                    options: {
                        outputPath: 'static/assets/'
                    }
                }
            ]
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
    });
};

module.exports = makeConfig;
