const childProcess = require('child_process');
const path = require('path');

// process.argv: ['node', 'run-in-gui.js', 'foo', ...]
const args = process.argv.slice(2);
args.unshift('run');
// args: ['run', 'foo', ...]

// copy environment (including PATH) then add or replace BUILD_MODE and STATIC_PATH
const env = {
    ...process.env,
    BUILD_MODE: 'dist',
    STATIC_PATH: 'static'
};

const child = childProcess.spawnSync(
    'npm', args,
    {
        cwd: path.join('node_modules', 'scratch-gui'),
        env,
        shell: true,
        stdio: 'inherit'
    }
);

if (child.error) throw child.error;
process.exit(child.status);
