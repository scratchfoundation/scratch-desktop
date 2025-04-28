const {spawn} = require('child_process');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const chalk = require('chalk');
const waitOn = require('wait-on');

const rendererConfig = require('../webpack.renderer.js');

const PORT = process.env.PORT || 8601;

const buildRenderer = () => new Promise((resolve, reject) => {
    console.log(chalk.cyan('Building renderer process...'));

    const compiler = webpack(rendererConfig);
    compiler.run((err, stats) => {
        if (err || stats.hasErrors()) {
            console.error(chalk.red('Renderer build failed:', err || stats.toString()));
            reject(err || new Error('Renderer build failed.'));
        } else {
            console.log(chalk.green('Renderer built successfully!'));
            resolve();
        }
    });
});

const startRenderer = async () => {
    console.log(chalk.cyan('Starting Webpack Dev Server...'));

    const compiler = webpack(rendererConfig);
    const server = new WebpackDevServer(
        {
            hot: true,
            compress: true,
            port: PORT,
            headers: {'Access-Control-Allow-Origin': '*'},
            historyApiFallback: true
        },
        compiler
    );

    try {
        await server.start();
        console.log(chalk.green(`Renderer is running at http://localhost:${PORT}`));
    } catch (err) {
        console.error(chalk.red('Failed to start Webpack Dev Server:', err));
        throw err;
    }
};

const startElectron = async () => {
    console.log(chalk.cyan('Starting Electron...'));

    await waitOn({resources: [`http://localhost:${PORT}`]});

    spawn('electron', ['.'], {
        stdio: 'inherit',
        shell: true
    });
};

const start = () => {
    console.log(chalk.green('Building main process...'));

    const mainProcess = spawn('npm', ['run', 'compile:main'], {
        stdio: 'inherit',
        shell: true
    });

    mainProcess.on('exit', async code => {
        if (code === 0) {
            console.log(chalk.green('Main process built successfully!'));

            await buildRenderer();
            await startRenderer();
            await startElectron();
        } else {
            console.log(chalk.red('Main process build failed!'));
            process.exit(1);
        }
    });
};

start();
