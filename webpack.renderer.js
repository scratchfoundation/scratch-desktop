const path = require('path');
const fsExtra = require('fs-extra');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const makeConfig = require('./webpack.makeConfig.js');

const getModulePath = moduleName => path.dirname(require.resolve(`${moduleName}`));

const generateIndexFile = template => {
    let html = template;

    html = html.replace(
        '</head>', '<script>require("source-map-support/source-map-support.js").install()</script></head>'
    );

    const filePath = path.join('dist', '.renderer-index-template.html');
    fsExtra.outputFileSync(filePath, html);
    return `!!html-loader?minimize=false&attributes=false!${filePath}`;
};

const template = fsExtra.readFileSync('src/renderer/index.html', {encoding: 'utf8'});

module.exports = makeConfig(
    {
        target: 'electron-renderer',
        entry: {
            renderer: './src/renderer/index.js'
        },
        context: path.resolve(__dirname),
        externals: [
            'source-map-support',
            'electron',
            'webpack'
        ],
        output: {
            filename: '[name].js',
            assetModuleFilename: 'static/assets/[name].[hash][ext]',
            chunkFilename: '[name].bundle.js',
            libraryTarget: 'commonjs2',
            path: path.resolve(__dirname, 'dist/renderer')
        },
        module: {
            rules: [
                {
                    test: /\.node$/,
                    use: 'node-loader'
                },
                {
                    test: /\.(html)$/,
                    use: {loader: 'html-loader'}
                }
            ]
        }
    },
    {
        name: 'renderer',
        useReact: true,
        disableDefaultRulesForExtensions: ['js', 'jsx', 'css', 'svg', 'png', 'wav', 'gif', 'jpg', 'ttf'],
        babelPaths: [
            path.resolve(__dirname, 'src', 'renderer'),
            /node_modules[\\/]+@scratch[\\/]+[^\\/]+[\\/]+src/,
            /node_modules[\\/]+pify/,
            /node_modules[\\/]+@vernier[\\/]+godirect/
        ],
        plugins: [
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: generateIndexFile(template),
                minify: false
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(getModulePath('@scratch/scratch-gui'), 'static'),
                        to: 'static'
                    },
                    {
                        from: 'extension-worker.{js,js.map}',
                        context: getModulePath('@scratch/scratch-gui')
                    },
                    {
                        from: path.join(getModulePath('@scratch/scratch-gui'), 'libraries'),
                        to: 'static/libraries',
                        flatten: true
                    },
                    {
                        // We need to copy the chunks for translating tutorial images for
                        // the tutorial translations to work.
                        from: path.join(getModulePath('@scratch/scratch-gui'), 'chunks'),
                        to: 'chunks'
                    }
                    // This still results in a missing fetch worker error, because the fetch-worker
                    // is attempted to be resolved on an absolute path (e.g. file:///chunks/fetch-worker..)
                    // That is still fine, because we don't need the fetch-worker to retrieve information.
                    // TODO: For a long term fix, change how the fetch-worker is resolved in `scratch-storage`
                    // {
                    //     context: getModulePath('@scratch/scratch-gui'),
                    //     from: 'chunks/fetch-worker.*.{js,js.map}',
                    //     noErrorOnMissing: true
                    // }
                ]
            })
        ]
    }
);
