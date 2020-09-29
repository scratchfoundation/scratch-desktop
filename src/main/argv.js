import minimist from 'minimist';

// inspired by yargs' process-argv
export const isElectronApp = () => !!process.versions.electron;
export const isElectronBundledApp = () => isElectronApp() && !process.defaultApp;

export const parseAndTrimArgs = argv => {
    // bundled Electron app: ignore 1 from "my-app arg1 arg2"
    // unbundled Electron app: ignore 2 from "electron main/index.js arg1 arg2"
    // node.js app: ignore 2 from "node src/index.js arg1 arg2"
    const ignoreCount = isElectronBundledApp() ? 1 : 2;

    const parsed = minimist(argv);

    // ignore arguments AFTER parsing to handle cases like "electron --inspect=42 my.js arg1 arg2"
    parsed._ = parsed._.slice(ignoreCount);

    return parsed;
};

const argv = parseAndTrimArgs(process.argv);

export default argv;
