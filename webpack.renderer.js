const path = require('path');
const fsExtra = require("fs-extra");

const HtmlWebpackPlugin = require('html-webpack-plugin')

const CopyWebpackPlugin = require('copy-webpack-plugin');

const makeConfig = require('./webpack.makeConfig.js');

const getModulePath = moduleName => path.dirname(require.resolve(`${moduleName}/package.json`));


function generateIndexFile(template) {
	let html = template;

	html = html.replace("</head>", '<script>require("source-map-support/source-map-support.js").install()</script></head>')

	const filePath = path.join("dist", ".renderer-index-template.html");
	fsExtra.outputFileSync(filePath, html);
	return `!!html-loader?minimize=false&attributes=false!${filePath}`
}

let template = fsExtra.readFileSync("src/renderer/index.html", {encoding: "utf8"});

module.exports = makeConfig(
    {
        target: "electron-renderer",
        entry: {
            renderer: './src/renderer/index.js'
        },
        context : path.resolve(__dirname),
        externals: [
            'source-map-support',
            'electron',
            'webpack',
        ],
        output: {
            filename: '[name].js',
            chunkFilename: '[name].bundle.js',
            libraryTarget: 'commonjs2',
            path: path.resolve(__dirname, "dist/renderer"),
        },
        module: { 
            rules: [
                {
                    test: /\.node$/,
                    use: "node-loader"
                },
                {
                    test: /\.(html)$/,
                    use: { "loader": "html-loader" }
                },
            ]
        },
    },
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
            new HtmlWebpackPlugin({
                filename: "index.html",
                template: generateIndexFile(template),
                minify: false,
            }),
            new CopyWebpackPlugin([
                {
                    from: path.join(getModulePath('scratch-blocks'), 'media'),
                    to: 'static/blocks-media/default'
                },
                {
                    from: path.join(getModulePath('scratch-blocks'), 'media'),
                    to: 'static/blocks-media/high-contrast'
                },
                {
                    from: path.join(getModulePath('scratch-gui'),
                        'src', 'lib', 'themes', 'high-contrast', 'blocks-media'),
                    to: 'static/blocks-media/high-contrast',
                    force: true
                },
                {
                    from: 'extension-worker.{js,js.map}',
                    context: path.join(getModulePath('scratch-vm'), 'dist', 'web')
                },
                {
                    from: path.join(getModulePath('scratch-gui'), 'src', 'lib', 'libraries', '*.json'),
                    to: 'static/libraries',
                    flatten: true
                }
            ])
        ]
    }
);
