const path = require('path');

const makeConfig = require('./webpack.makeConfig.js');

module.exports = defaultConfig =>
    makeConfig(
        defaultConfig,
        {
            name: 'main',
            useReact: false,
            disableDefaultRulesForExtensions: ['js'],
            babelPaths: [
                path.resolve(__dirname, 'src', 'main')
            ]
        }
    );
