const path = require('path');
const v8 = require('v8');

const desiredHeapSizeMB = 2560; // determined experimentally
const actualHeapSizeMB = v8.getHeapStatistics().heap_size_limit / 1024 / 1024;

console.log(`Current Node heap size limit: ${actualHeapSizeMB} MB`);
if (actualHeapSizeMB < desiredHeapSizeMB) {
    console.warn([
        '**********',
        `WARNING: Node heap size limit is smaller than ${desiredHeapSizeMB} MB! Webpack may fail!`,
        `To increase this limit set NODE_OPTIONS to include something like: --max-old-space-size=${desiredHeapSizeMB}`,
        '**********'
    ].join('\n'));
}

const CopyWebpackPlugin = require('copy-webpack-plugin');

const makeConfig = require('./webpack.makeConfig.js');

const getModulePath = moduleName => path.dirname(require.resolve(`${moduleName}/package.json`));

module.exports = defaultConfig =>
    makeConfig(
        defaultConfig,
        {
            name: 'renderer',
            useReact: true,
            disableDefaultRulesForExtensions: ['js', 'jsx', 'css', 'svg', 'png', 'wav', 'gif', 'jpg', 'ttf'],
            babelPaths: [
                path.resolve(__dirname, 'src', 'renderer'),
                /node_modules[\\/]+scratch-[^\\/]+[\\/]+src/,
                /node_modules[\\/]+pify/,
                /node_modules[\\/]+@vernier[\\/]+godirect/
            ],
            plugins: [
                new CopyWebpackPlugin([{
                    from: path.join(getModulePath('scratch-blocks'), 'media'),
                    to: 'static/blocks-media'
                }]),
                new CopyWebpackPlugin([{
                    from: 'extension-worker.{js,js.map}',
                    context: path.join(getModulePath('scratch-vm'), 'dist', 'web')
                }]),
                new CopyWebpackPlugin([{
                    from: path.join(getModulePath('scratch-gui'), 'src', 'lib', 'libraries', '*.json'),
                    to: 'static/libraries',
                    flatten: true
                }])
            ]
        }
    );
