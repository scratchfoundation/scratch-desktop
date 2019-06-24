const childProcess = require('child_process');
const path = require('path');

const child = childProcess.spawnSync(
    'npm', ['run', 'build'],
    {
        cwd: path.join('node_modules', 'scratch-gui'),
        env: {
            ...process.env,
            BUILD_MODE: 'dist',
            STATIC_PATH: 'static'
        },
        shell: true,
        stdio: 'inherit'
    }
);

if (child.error) throw child.error;
process.exit(child.status);
