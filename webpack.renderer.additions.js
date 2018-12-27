const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const makeConfig = require('./webpack.makeConfig.js');

module.exports = makeConfig({
    name: 'renderer',
    useReact: true,
    babelPaths: [
        path.resolve(__dirname, 'src', 'renderer')
    ],
    plugins: [
        new CopyWebpackPlugin([{
            from: path.resolve(__dirname, 'node_modules', 'scratch-gui', 'dist', 'static'),
            to: 'static'
        }])
    ]
});
