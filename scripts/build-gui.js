const childProcess = require('child_process');
const path = require('path');

childProcess.spawnSync(
    'npm', ['run', 'build'],
    {
        cwd: path.join('node_modules', 'scratch-gui'),
        env: {
            BUILD_MODE: 'dist',
            STATIC_PATH: 'static'
        },
        shell: true,
        stdio: 'inherit'
    }
);
