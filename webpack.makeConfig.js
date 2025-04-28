const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const electronPath = require('electron');
const webpack = require('webpack');
const merge = require('webpack-merge');

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
            '@babel/plugin-proposal-object-rest-spread',
            '@babel/plugin-transform-nullish-coalescing-operator',
            '@babel/plugin-transform-optional-chaining'
        ],
        presets: [
            ['@babel/preset-env', {targets: {electron: electronVersion}}]
        ]
    };

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
            const statusWord = shouldDisable ? 'Discarding' : 'Keeping';
            console.log(`${options.name}: ${statusWord} electron-webpack default rule for ${rule.test}`);
            return !shouldDisable;
        });
    }

    const config = merge.smart(defaultConfig, {
        devtool: 'cheap-module-source-map',
        mode: isProduction ? 'production' : 'development',
        module: {
            rules: [
                {
                    test: options.useReact ? /\.jsx?$/ : /\.js$/,
                    include: options.babelPaths,
                    loader: 'babel-loader',
                    options: babelOptions
                },
                {

                    test: /\.css$/,
                    use: [
                        {
                            loader: 'style-loader'
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                modules: {
                                    localIdentName: '[name]_[local]_[hash:base64:5]',
                                    exportLocalsConvention: 'camelCase'
                                },
                                importLoaders: 1,
                                esModule: false
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    plugins: [
                                        'postcss-import',
                                        'postcss-simple-vars',
                                        'autoprefixer'
                                    ]
                                }
                            }
                        }
                    ]
                },
                {
                    test: /\.(svg|png|wav|gif|jpg)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'static/assets/[name].[hash][ext]'
                    }
                },
                {
                    test: /\.hex$/,
                    use: [{
                        loader: 'url-loader',
                        options: {
                            limit: 16 * 1024
                        }
                    }]
                }
            ]
        },
        plugins: [
            new webpack.SourceMapDevToolPlugin({
                filename: '[file].map'
            }),
            new webpack.DefinePlugin({
                __static: isProduction ?
                    'process.resourcesPath + "/static"' :
                    JSON.stringify(path.resolve(process.cwd(), 'static'))
            })
        ].concat(options.plugins || []),
        resolve: {
            cacheWithContext: false,
            symlinks: false,
            // attempt to resolve file extensions in this order
            // (allows leaving off the extension when importing)
            extensions: ['.js', '.jsx', '.json', '.node', '.css']
        }
    });

    // If we're not on CI, enable Webpack progress output
    if (!process.env.CI) {
        config.plugins.push(new webpack.ProgressPlugin());
    }

    fs.writeFileSync(
        `dist/webpack.${options.name}.js`,
        `module.exports = ${util.inspect(config, {depth: null})};\n`
    );

    return config;
};

module.exports = makeConfig;
