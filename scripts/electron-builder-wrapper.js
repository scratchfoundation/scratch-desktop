/**
 * @overview This script runs `electron-builder` with special management of code signing configuration on Windows.
 * Running this script with no command line parameters should build all targets for the current platform.
 * Pass `--target=<short-name>` to build exactly one target instead of the platform default set; the matrix in
 * `release-candidate.yml` uses this to fan a multi-target serial pass out into one runner per target. Valid short
 * names: `mas`, `mas-dev`, `dmg`, `appx`, `nsis`, `msi`, `installers`, `nsis-x64`.
 * This calls electron-builder's documented programmatic API (`build()`) directly instead of spawning the CLI, so
 * build options are passed as a structured object — there is no shell and no argument quoting to get wrong. The
 * `config` object is deep-merged over `electron-builder.yaml`; it only adds overrides, never replaces the file.
 * See https://www.electron.build/programmatic-usage
 * Windows signing uses Azure Artifact Signing. This script supplies `win.azureSignOptions` in the build config
 * from the `AZURE_SIGNING_*` environment variables (not via `electron-builder.yaml`, which would sign every build,
 * including PR CI and local dev). Auth uses an Azure client secret read by Azure.Identity's EnvironmentCredential
 * (`AZURE_TENANT_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET`, set in `release-candidate.yml`). Signing happens
 * only in --mode=dist; --mode=dev (the default) and --mode=dir build unsigned.
 * On Mac, the CSC_* variables are optional; they're respected only for signed (--mode=dist) builds and stripped
 * otherwise. Because the build now runs in-process, "stripping" means removing those vars from `process.env`
 * (which electron-builder reads directly) for the duration of the build, then restoring them.
 * See also: https://www.electron.build/code-signing
 */

const builder = require('electron-builder');
const fs = require('fs');

const masDevProfile = 'build/Development_edu.mit.scratch.scratch-desktop.provisionprofile';

// Code-signing environment variables electron-builder reads from `process.env`. We remove these for AppX and
// unsigned passes (see stripCSCFromProcessEnv).
const cscEnvKeys = ['CSC_LINK', 'CSC_KEY_PASSWORD', 'WIN_CSC_LINK', 'WIN_CSC_KEY_PASSWORD'];

/**
 * Temporarily remove code signing configuration (CSC) from `process.env`, returning a function that restores it.
 * electron-builder runs in this same process and reads CSC config straight from `process.env`, so there's no child
 * environment to filter the way a spawned process had — we mutate the live environment and put it back afterward.
 * The restore is symmetric: each key is returned to its original value, or deleted again if it was absent before
 * (so a key the build might introduce doesn't leak into a later pass).
 * @returns {function(): void} - call to restore the removed variables.
 */
const stripCSCFromProcessEnv = function () {
    // Record only the keys that were actually present (with their values); absent keys stay out of `original`.
    const original = {};
    for (const key of cscEnvKeys) {
        if (key in process.env) {
            original[key] = process.env[key];
        }
        delete process.env[key];
    }
    return function restore () {
        for (const key of cscEnvKeys) {
            if (key in original) {
                process.env[key] = original[key];
            } else {
                delete process.env[key];
            }
        }
    };
};

/**
 * @param {string} platform - a Node `process.platform` value.
 * @returns {string} - the matching electron-builder option key (`mac`, `win`, or `linux`).
 */
const getPlatformKey = function (platform) {
    switch (platform) {
    case 'win32': return 'win';
    case 'darwin': return 'mac';
    case 'linux': return 'linux';
    }
    throw new Error(`Could not determine platform key for platform: ${platform}`);
};

/**
 * Run `electron-builder` once to build one or more target(s).
 * @param {object} wrapperConfig - overall configuration object for the wrapper script.
 * @param {object} target - the target to build in this call.
 */
const runBuilder = async function (wrapperConfig, target) {
    // A pass can bundle several targets (e.g. the installers pass). We hand the list to electron-builder under
    // the platform key (win/mac/linux) — deliberately NOT as `options.targets`, which would short-circuit
    // electron-builder's own option normalization — so it parses the `type:arch` suffixes (e.g. `nsis:x64`) and
    // applies the dir / universal / mac.identity handling for us instead of us reimplementing it.
    const targetNames = target.targets;
    // Strip CSC_* env vars when any AppX target is in the pass (CSC would conflict with the Store-managed cert)
    // and for unsigned builds. Windows signing itself goes through Azure (not CSC), so these vars are typically
    // absent anyway.
    const shouldStripCSC = targetNames.some(name => name.startsWith('appx')) || (!wrapperConfig.doSign);

    // Build-option overrides. electron-builder deep-merges this over electron-builder.yaml, so we only add to the
    // on-disk config here.
    const platformKey = getPlatformKey(target.platform);
    const config = {};
    const options = {
        [platformKey]: targetNames,
        // Never auto-publish: electron-builder.yaml declares no publish providers and releases are collected from
        // the build artifacts by hand. Set the policy explicitly so electron-builder doesn't infer one from CI
        // detection — an implicit behavior it warns about and plans to drop in a future major.
        publish: 'never',
        config
    };

    if (target.platform === 'darwin') {
        config.mac = {type: wrapperConfig.mode === 'dist' ? 'distribution' : 'development'};
        // Build universal so the executable runs on both x86-64 and arm64. This needs to be built on an arm64 mac.
        options.universal = true;
        if (targetNames.includes('mas-dev')) {
            config.mac.provisioningProfile = masDevProfile;
        }
        if (!wrapperConfig.doSign) {
            config.mac.identity = null;
        }
        // When signing, electron-builder notarizes via @electron/notarize when
        // APPLE_API_KEY / APPLE_API_KEY_ID / APPLE_API_ISSUER are present in the environment.
    }

    if (target.platform === 'win32') {
        // Organization-specific identifiers. electron-builder only expands ${env.X} macros in filename fields like
        // artifactName, not in config fields like these, so we supply them from the environment here. Each is
        // applied only when its variable is set (a fork that doesn't set them builds with electron-builder's
        // defaults, so a fork never builds under our published identity).
        const appx = {};
        if (process.env.APPX_IDENTITY_NAME) {
            appx.identityName = process.env.APPX_IDENTITY_NAME;
        }
        if (process.env.APPX_PUBLISHER) {
            appx.publisher = process.env.APPX_PUBLISHER;
        }
        if (process.env.APPX_PUBLISHER_DISPLAY_NAME) {
            appx.publisherDisplayName = process.env.APPX_PUBLISHER_DISPLAY_NAME;
        }
        if (Object.keys(appx).length > 0) {
            config.appx = appx;
        }
        if (process.env.MSI_UPGRADE_CODE) {
            config.msi = {upgradeCode: process.env.MSI_UPGRADE_CODE};
        }
    }

    // Appx-only means every target name in the pass starts with 'appx'. A mixed pass that bundles appx with nsis
    // or msi keeps signing on for the non-appx parts; only the pure-appx case opts out so the Store can re-sign
    // its container with unsigned inner binaries (today's behavior).
    const isAppxOnly = targetNames.every(name => name.startsWith('appx'));
    if (target.platform === 'win32' && wrapperConfig.doSign && !isAppxOnly) {
        // Supply Azure Artifact Signing config here rather than in electron-builder.yaml. Putting it in YAML would
        // activate signing for every build, including PR CI and local dev where Azure auth isn't available — and
        // some signing paths (notably the NSIS uninstaller) ignore the win.signAndEditExecutable flag, so
        // per-target gating isn't reliable. AppX-only passes skip signing entirely: the Microsoft Store re-signs
        // the outer .appx during certification, and we want the inner binaries unsigned (electron-builder would
        // otherwise sign them via signExts).
        // Preflight everything signing needs: the azureSignOptions config (AZURE_SIGNING_*) and the Azure.Identity
        // credentials electron-builder reads from the environment. Checking the credentials here turns the opaque
        // "Unable to find valid azure env configuration" failure — e.g. an expired, rotated, or mis-pasted client
        // secret — into an immediate, named error.
        const required = [
            'AZURE_SIGNING_ENDPOINT',
            'AZURE_SIGNING_ACCOUNT_NAME',
            'AZURE_SIGNING_PROFILE_NAME',
            'AZURE_SIGNING_PUBLISHER_NAME',
            'AZURE_TENANT_ID',
            'AZURE_CLIENT_ID',
            'AZURE_CLIENT_SECRET'
        ];
        const missing = required.filter(name => !process.env[name]);
        if (missing.length > 0) {
            throw new Error(`Azure signing requires env vars: ${missing.join(', ')}`);
        }
        config.win = {
            azureSignOptions: {
                endpoint: process.env.AZURE_SIGNING_ENDPOINT,
                codeSigningAccountName: process.env.AZURE_SIGNING_ACCOUNT_NAME,
                certificateProfileName: process.env.AZURE_SIGNING_PROFILE_NAME,
                publisherName: process.env.AZURE_SIGNING_PUBLISHER_NAME
            }
        };
    }

    if (!wrapperConfig.doPackage) {
        // Build to an unpacked directory instead of installers, and skip compression to make it quick.
        options.dir = true;
        config.compression = 'store';
    }

    console.log(
        `running electron-builder: ${platformKey}=[${targetNames.join(', ')}]` +
        `${wrapperConfig.doSign ? ' (signed)' : ''}${wrapperConfig.doPackage ? '' : ' (dir only)'}`
    );

    const restoreEnv = shouldStripCSC ? stripCSCFromProcessEnv() : null;
    try {
        const artifacts = await builder.build(options);
        for (const artifact of artifacts) {
            console.log(`  built: ${artifact}`);
        }
    } finally {
        if (restoreEnv) {
            restoreEnv();
        }
    }
};

/**
 * @param {object} wrapperConfig - overall configuration object for the wrapper script.
 * @returns {Array.<object>} - the build passes for this platform. Each item is one call to `runBuilder` (a single
 * electron-builder invocation) and may bundle several targets — e.g. the Windows installers pass builds NSIS and
 * MSI together. Some targets are kept in separate passes because building them together has unwanted side effects
 * on macOS and Windows (see function body).
 */
const calculateTargets = function (wrapperConfig) {
    // Each descriptor's `targets` is the electron-builder target list for one `runBuilder` pass, in `type:arch`
    // form. `platform` is the Node `process.platform` value the pass runs on.
    const availableTargets = {
        macAppStore: {
            targets: ['mas'],
            platform: 'darwin'
        },
        macAppStoreDev: {
            targets: ['mas-dev'],
            platform: 'darwin'
        },
        macDirectDownload: {
            targets: ['dmg'],
            platform: 'darwin'
        },
        microsoftStore: {
            targets: ['appx:ia32', 'appx:x64', 'appx:arm64'],
            platform: 'win32'
        },
        windowsDirectDownload: {
            targets: ['nsis:ia32', 'nsis:x64', 'nsis:arm64'],
            platform: 'win32'
        },
        windowsManagedDeployment: {
            targets: ['msi:x64'],
            platform: 'win32'
        },
        windowsInstallers: {
            // Combined pass: every Windows target that should be code-signed.
            // AppX intentionally lives in its own pass because it must not be signed at build time
            // (the Microsoft Store re-signs during certification).
            targets: ['nsis:ia32', 'nsis:x64', 'nsis:arm64', 'msi:x64'],
            platform: 'win32'
        },
        windowsNsisX64: {
            // Single representative installer for PR-time CI — the smallest build that still
            // produces something a non-developer teammate can install and try on Windows x64.
            targets: ['nsis:x64'],
            platform: 'win32'
        },
        linuxAppImage: {
            targets: ['appimage'],
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
            'installers': availableTargets.windowsInstallers,
            'nsis-x64': availableTargets.windowsNsisX64
        };
        const selected = targetsByShortName[wrapperConfig.target];
        if (!selected) {
            throw new Error(
                `Unknown --target value: "${wrapperConfig.target}". ` +
                `Valid values: ${Object.keys(targetsByShortName).join(', ')}.`
            );
        }
        // This wrapper builds every target on its own platform — the default target set is chosen by
        // process.platform and the release-candidate matrix runs each cell on a matching runner. A --target
        // whose platform doesn't match the current OS is a mistake (e.g. `--target=nsis-x64` on macOS); fail
        // fast rather than let electron-builder attempt a cross-platform build that errors confusingly or, for
        // some targets, quietly produces an unexpected artifact.
        if (selected.platform !== process.platform) {
            throw new Error(
                `Target "${wrapperConfig.target}" builds for ${selected.platform}, but this runner is ` +
                `${process.platform}. Run it on a ${selected.platform} runner.`
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
            console.log(
                `skipping target "${availableTargets.macAppStoreDev.targets.join(', ')}": ${masDevProfile} missing`
            );
        }
        if (wrapperConfig.doSign) {
            targets.push(availableTargets.macAppStore);
        } else {
            // electron-builder doesn't seem to support this configuration even if mac.type is "development"
            console.log(
                `skipping target "${availableTargets.macAppStore.targets.join(', ')}" because code-signing is disabled`
            );
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

const main = async function () {
    const wrapperConfig = parseArgs();

    if (wrapperConfig.builderArgs.length > 0) {
        // The programmatic API takes structured options, not raw CLI flags. Nothing in this repo passes extra
        // electron-builder arguments today; if that changes, translate them into `options`/`config` in runBuilder
        // rather than letting them be silently dropped.
        throw new Error(
            `Unsupported extra electron-builder arguments: ${wrapperConfig.builderArgs.join(' ')}. ` +
            `Add handling for them in ${__filename} instead of passing raw CLI flags.`
        );
    }

    wrapperConfig.targets = calculateTargets(wrapperConfig);

    for (const target of wrapperConfig.targets) {
        await runBuilder(wrapperConfig, target);
    }
};

main().catch(error => {
    console.error(error);
    process.exit(1);
});
