const path = require('path');

module.exports = {
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                // include: [path.resolve(__dirname, 'src', 'renderer'), /node_modules[\\/]scratch-[^\\/]+[\\/]src/],
                options: {
                    // Explicitly disable babelrc so we don't catch various config
                    // in much lower dependencies.
                    babelrc: false,
                    plugins: [
                        '@babel/proposal-object-rest-spread'
                        // 'syntax-dynamic-import',
                        // 'transform-async-to-generator',
                        // 'transform-object-rest-spread',
                        // ['react-intl', {
                        //     messagesDir: './translations/messages/'
                        // }]
                    ],
                    presets: [
                    //     ['env', {targets: {electron: '2.0.7'}}],
                        '@babel/react'
                    ]
                }
            }
        ]
    }
};
