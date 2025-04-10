const path = require('path');

const makeConfig = require('./webpack.makeConfig.js');

module.exports = makeConfig(
    {
        target: 'electron-main',
        entry: {
            main: './src/main/index.js'
        },
        context: path.resolve(__dirname),
        externals: [
            'source-map-support',
            'electron',
            'webpack',
            'webpack/hot/log-apply-result',
            'electron-webpack/out/electron-main-hmr/HmrClient',
            'source-map-support/source-map-support.js'
        ],
        output: {
            filename: '[name].js',
            chunkFilename: '[name].bundle.js',
            assetModuleFilename: 'static/assets/[name].[hash][ext]',
            libraryTarget: 'commonjs2',
            path: path.resolve(__dirname, 'dist/main')
        },
        module: {rules: []},
        node: {__dirname: false, __filename: false}
    },
    {
        name: 'main',
        useReact: false,
        disableDefaultRulesForExtensions: ['js'],
        babelPaths: [
            path.resolve(__dirname, 'src', 'main')
        ]
    }
);
