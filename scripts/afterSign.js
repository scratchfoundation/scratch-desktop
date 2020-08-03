const {notarize} = require('electron-notarize');

const notarizeMacBuild = async function (context) {
    // keep this in sync with appId in the electron-builder config
    const appId = 'edu.mit.scratch.scratch-desktop';

    if (!process.env.AC_USERNAME) {
        console.error([
            'This build is not notarized and will not run on newer versions of macOS!',
            'Notarizing the macOS build requires an Apple ID. To notarize future builds:',
            '* Set the environment variable AC_USERNAME to your@apple.id and',
            '* Either set AC_PASSWORD or ensure your keychain has an item for "Application Loader: your@apple.id"'
        ].join('\n'));
        return;
    }

    const appleId = process.env.AC_USERNAME;
    const appleIdKeychainItem = `Application Loader: ${appleId}`;

    if (process.env.AC_PASSWORD) {
        console.log(`Notarizing with Apple ID "${appleId}" and a password`);
    } else {
        console.log(`Notarizing with Apple ID "${appleId}" and keychain item "${appleIdKeychainItem}"`);
    }

    const {appOutDir} = context;
    const productFilename = context.packager.appInfo.productFilename;
    await notarize({
        appBundleId: appId,
        appPath: `${appOutDir}/${productFilename}.app`,
        appleId,
        appleIdPassword: process.env.AC_PASSWORD || `@keychain:${appleIdKeychainItem}`
    });
};

const afterSign = async function (context) {
    const {electronPlatformName} = context;

    switch (electronPlatformName) {
    case 'mas': // macOS build for Mac App Store
        break;
    case 'darwin': // macOS build NOT for Mac App Store
        await notarizeMacBuild(context);
        break;
    }
};

module.exports = afterSign;
