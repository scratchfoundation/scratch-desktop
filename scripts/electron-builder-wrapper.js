const {spawnSync} = require('child_process');

const stripCSC = function (environment) {
    const {
        CSC_LINK: _CSC_LINK,
        CSC_KEY_PASSWORD: _CSC_KEY_PASSWORD,
        WIN_CSC_LINK: _WIN_CSC_LINK,
        WIN_CSC_KEY_PASSWORD: _WIN_CSC_KEY_PASSWORD,
        ...strippedEnvironment
    } = environment;
    return strippedEnvironment;
};

const getPlatformFlag = function () {
    switch (process.platform) {
    case 'win32': return '--windows';
    case 'darwin': return '--macos';
    case 'linux': return '--linux';
    }
    throw new Error(`Could not determine platform flag for platform: ${process.platform}`);
}

const runBuilder = function (targetGroup) {
    // the appx build fails if CSC_* or WIN_CSC_* variables are set
    const shouldStripCSC = (targetGroup === 'appx');
    const childEnvironment = shouldStripCSC ? stripCSC(process.env) : process.env;
    if ((targetGroup === 'nsis') && !(childEnvironment.CSC_LINK || childEnvironment.WIN_CSC_LINK)) {
        throw new Error(`NSIS build requires CSC_LINK or WIN_CSC_LINK`);
    }
    const platformFlag = getPlatformFlag();
    const command = `electron-builder ${platformFlag} ${targetGroup}`;
    console.log(`running: ${command}`);
    spawnSync(command, {
        env: childEnvironment,
        shell: true,
        stdio: 'inherit'
    });
};

const calculateTargets = function () {
    switch (process.platform) {
    case 'win32':
        // run in two passes so we can skip signing the appx
        return ['nsis', 'appx'];
    case 'darwin':
        // run in one pass for slightly better speed
        return ['dmg mas'];
    }
    throw new Error(`Could not determine targets for platform: ${process.platform}`);
};

// TODO: allow user to specify targets? We could theoretically build NSIS on Mac, for example.
const targets = calculateTargets();
for (const targetGroup of targets) {
    runBuilder(targetGroup);
}
