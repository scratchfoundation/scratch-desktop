const path = require('path');

const makeConfig = require('./webpack.makeConfig.js');

module.exports = makeConfig({
    name: 'main',
    useReact: false,
    babelPaths: [
        path.resolve(__dirname, 'src', 'main')
    ]
});
