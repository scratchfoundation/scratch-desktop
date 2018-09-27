const path = require('path');

module.exports = {
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                resolve: {
                    symlinks: false
                },
                include: [
                    path.resolve(__dirname, 'src', 'renderer'),
                    /node_modules[\\/]scratch-[^\\/]+[\\/]src/
                ],
                options: {
                    // Explicitly disable babelrc so we don't catch various config
                    // in much lower dependencies.
                    babelrc: false,
                    cacheDirectory: true,
                    plugins: [
                        '@babel/proposal-object-rest-spread',
                        // 'syntax-dynamic-import',
                        // 'transform-async-to-generator',
                        ['react-intl', {
                            messagesDir: './translations/messages/'
                        }]
                    ],
                    presets: [
                        ['@babel/env', {targets: {electron: '2.0.7'}}],
                        '@babel/react'
                    ]
                }
            }
        ]
    }
};
