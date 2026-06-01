/**
 * @overview This script runs `electron-builder` with special management of code signing configuration on Windows.
 * Running this script with no command line parameters should build all targets for the current platform.
 * Pass `--target=<short-name>` to build exactly one target instead of the platform default set; the matrix in
 * `release-candidate.yml` uses this to fan a multi-target serial pass out into one runner per target. Valid short
 * names: `mas`, `mas-dev`, `dmg`, `appx`, `nsis`.
 * On Windows, make sure to set CSC_* or WIN_CSC_* environment variables or the NSIS build will fail.
 * On Mac, the CSC_* variables are optional but will be respected if present.
 * See also: https://www.electron.build/code-signing
 */

const {spawnSync} = require('child_process');
const fs = require('fs');

const masDevProfile = 'build/Development_edu.mit.scratch.scratch-desktop.provisionprofile';

/**
 * Strip any code signing configuration (CSC) from a set of environment variables.
 * @param {object} environment - a collection of environment variables which might include code signing configuration.
 * @returns {object} - a collection of environment variables which does not include code signing configuration.
 */
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

/**
 * @returns {string} - an `electron-builder` flag to build for the current platform, based on `process.platform`.
 */
const getPlatformFlag = function () {
    switch (process.platform) {
    case 'win32': return '--windows';
    case 'darwin': return '--macos';
    case 'linux': return '--linux';
    }
    throw new Error(`Could not determine platform flag for platform: ${process.platform}`);
};

/**
 * Run `electron-builder` once to build one or more target(s).
 * @param {object} wrapperConfig - overall configuration object for the wrapper script.
 * @param {object} target - the target to build in this call.
 * If the `target.name` is `'nsis'` then the environment must contain code-signing config (CSC_* or WIN_CSC_*).
 * If the `target.name` is `'appx'` then code-signing config will be stripped from the environment if present.
 */
const runBuilder = function (wrapperConfig, target) {
    // the AppX build fails if CSC_* or WIN_CSC_* variables are set
    const shouldStripCSC = (target.name.indexOf('appx') === 0) || (!wrapperConfig.doSign);
    const childEnvironment = shouldStripCSC ? stripCSC(process.env) : process.env;
    if (wrapperConfig.doSign &&
        (target.name.indexOf('nsis') === 0) &&
        !(childEnvironment.CSC_LINK || childEnvironment.WIN_CSC_LINK)) {
        throw new Error(`Signing NSIS build requires CSC_LINK or WIN_CSC_LINK`);
    }
    const platformFlag = getPlatformFlag();
    let allArgs = [platformFlag, target.name];
    if (target.platform === 'darwin') {
        allArgs.push(`--c.mac.type=${wrapperConfig.mode === 'dist' ? 'distribution' : 'development'}`);
        // this needs to be built on an arm64 mac, in order for the executable to be able
        // to run on both x86-64 and arm64 architectures.
        allArgs.push('--universal');
        if (target.name === 'mas-dev') {
            allArgs.push(`--c.mac.provisioningProfile=${masDevProfile}`);
        }
        if (!wrapperConfig.doSign) {
            allArgs.push('--c.mac.identity=null');
        }
        // When signing, electron-builder notarizes via @electron/notarize when
        // APPLE_API_KEY / APPLE_API_KEY_ID / APPLE_API_ISSUER are present in
        // the environment.
    }
    if (!wrapperConfig.doPackage) {
        allArgs.push('--dir', '--c.compression=store');
    }
    allArgs = allArgs.concat(wrapperConfig.builderArgs);
    console.log(`running electron-builder with arguments: ${allArgs}`);
    const result = spawnSync('electron-builder', allArgs, {
        env: childEnvironment,
        shell: true,
        stdio: 'inherit'
    });
    if (result.error) {
        throw result.error;
    }
    if (result.signal) {
        throw new Error(`Child process terminated due to signal ${result.signal}`);
    }
    if (result.status) {
        throw new Error(`Child process returned status code ${result.status}`);
    }
};

/**
 * @param {object} wrapperConfig - overall configuration object for the wrapper script.
 * @returns {Array.<object>} - the default list of targets on this platform. Each item in the array represents one
 * call to `runBuilder` for exactly one build target. In theory electron-builder can build two or more targets at the
 * same time but doing so limits has unwanted side effects on both macOS and Windows (see function body).
 */
const calculateTargets = function (wrapperConfig) {
    const availableTargets = {
        macAppStore: {
            name: 'mas',
            platform: 'darwin'
        },
        macAppStoreDev: {
            name: 'mas-dev',
            platform: 'darwin'
        },
        macDirectDownload: {
            name: 'dmg',
            platform: 'darwin'
        },
        microsoftStore: {
            name: 'appx:ia32 appx:x64 appx:arm64',
            platform: 'win32'
        },
        windowsDirectDownload: {
            name: 'nsis:ia32 nsis:x64 nsis:arm64',
            platform: 'win32'
        },
        windowsManagedDeployment: {
            name: 'msi:x64',
            platform: 'win32'
        },
        windowsInstallers: {
            // Combined pass: every Windows target that should be code-signed.
            // AppX intentionally lives in its own pass because it must not be signed at build time
            // (the Microsoft Store re-signs during certification).
            name: 'nsis:ia32 nsis:x64 nsis:arm64 msi:x64',
            platform: 'win32'
        },
        linuxAppImage: {
            name: 'appimage',
            platform: 'linux'
        }
    };
    // --target=<short-name> overrides the platform default and builds exactly
    // one target. Used by the release-candidate matrix to fan a multi-target
    // serial pass out into one runner per target. Bypasses the doSign/profile
    // skips below: the matrix dispatcher is asserting "build this and only
    // this", so a missing prerequisite should fail loudly rather than be
    // silently skipped.
    if (wrapperConfig.target) {
        const targetsByShortName = {
            'mas': availableTargets.macAppStore,
            'mas-dev': availableTargets.macAppStoreDev,
            'dmg': availableTargets.macDirectDownload,
            'appx': availableTargets.microsoftStore,
            'nsis': availableTargets.windowsDirectDownload,
            'msi': availableTargets.windowsManagedDeployment,
            'installers': availableTargets.windowsInstallers
        };
        const selected = targetsByShortName[wrapperConfig.target];
        if (!selected) {
            throw new Error(
                `Unknown --target value: "${wrapperConfig.target}". ` +
                `Valid values: ${Object.keys(targetsByShortName).join(', ')}.`
            );
        }
        return [selected];
    }
    const targets = [];
    switch (process.platform) {
    case 'win32':
        // Two passes: AppX intentionally unsigned (the Microsoft Store re-signs during cert),
        // everything else signed in a single pass.
        targets.push(availableTargets.microsoftStore);
        targets.push(availableTargets.windowsInstallers);
        break;
    case 'darwin':
        // Running 'dmg' and 'mas' in the same pass causes electron-builder to skip signing the non-MAS app copy.
        // Running them as separate passes means they can both get signed.
        // Seems like a bug in electron-builder...
        // Running the 'mas' build first means that its output is available while we wait for 'dmg' notarization.
        // Add macAppStoreDev here to test a MAS-like build locally. You'll need a Mac Developer provisioning profile.
        if (fs.existsSync(masDevProfile)) {
            targets.push(availableTargets.macAppStoreDev);
        } else {
            console.log(`skipping target "${availableTargets.macAppStoreDev.name}": ${masDevProfile} missing`);
        }
        if (wrapperConfig.doSign) {
            targets.push(availableTargets.macAppStore);
        } else {
            // electron-builder doesn't seem to support this configuration even if mac.type is "development"
            console.log(`skipping target "${availableTargets.macAppStore.name}" because code-signing is disabled`);
        }
        targets.push(availableTargets.macDirectDownload);
        break;
    case 'linux':
        targets.push(availableTargets.linuxAppImage);
        break;
    default:
        throw new Error(`Could not determine targets for platform: ${process.platform}`);
    }
    return targets;
};

const parseArgs = function () {
    const scriptArgs = process.argv.slice(2); // remove `node` and `this-script.js`
    const builderArgs = [];
    let mode = 'dev'; // default
    let target = null; // null = use platform-default target set

    for (const arg of scriptArgs) {
        const modeSplit = arg.split(/--mode(\s+|=)/);
        const targetSplit = arg.split(/--target(\s+|=)/);
        if (modeSplit.length === 3) {
            mode = modeSplit[2];
        } else if (targetSplit.length === 3) {
            target = targetSplit[2];
        } else {
            builderArgs.push(arg);
        }
    }

    let doPackage;
    let doSign;

    switch (mode) {
    case 'dev':
        doPackage = true;
        doSign = false;
        break;
    case 'dir':
        doPackage = false;
        doSign = false;
        break;
    case 'dist':
        doPackage = true;
        doSign = true;
    }

    return {
        builderArgs,
        doPackage, // false = build to directory
        doSign,
        mode,
        target,
        targets: null // filled in by main() after calculateTargets()
    };
};

const main = function () {
    const wrapperConfig = parseArgs();

    wrapperConfig.targets = calculateTargets(wrapperConfig);

    for (const target of wrapperConfig.targets) {
        runBuilder(wrapperConfig, target);
    }
};

main();
