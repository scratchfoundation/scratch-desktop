import {BrowserWindow, Menu, app, dialog, ipcMain} from 'electron';
import fs from 'fs';
import path from 'path';
import {format as formatUrl} from 'url';

import {getFilterForExtension} from './FileFilters';
import telemetry from './ScratchDesktopTelemetry';
import MacOSMenu from './MacOSMenu';

telemetry.appWasOpened();


// const defaultSize = {width: 1096, height: 715}; // minimum
const defaultSize = {width: 1280, height: 800}; // good for MAS screenshots

const isDevelopment = process.env.NODE_ENV !== 'production';

// global window references prevent them from being garbage-collected
const _windows = {};

const createWindow = ({search = null, url = 'index.html', ...browserWindowOptions}) => {
    const window = new BrowserWindow({
        useContentSize: true,
        show: false,
        webPreferences: {
            nodeIntegration: true
        },
        ...browserWindowOptions
    });
    const webContents = window.webContents;

    if (isDevelopment) {
        webContents.openDevTools({mode: 'detach', activate: true});
    }

    const fullUrl = formatUrl(isDevelopment ?
        { // Webpack Dev Server
            hostname: 'localhost',
            pathname: url,
            port: process.env.ELECTRON_WEBPACK_WDS_PORT,
            protocol: 'http',
            search,
            slashes: true
        } : { // production / bundled
            pathname: path.join(__dirname, url),
            protocol: 'file',
            search,
            slashes: true
        }
    );
    window.loadURL(fullUrl);

    return window;
};

const createAboutWindow = () => {
    const window = createWindow({
        width: 400,
        height: 400,
        parent: _windows.main,
        search: 'route=about',
        title: 'About Scratch Desktop'
    });
    return window;
};

const getIsProjectSave = downloadItem => {
    switch (downloadItem.getMimeType()) {
    case 'application/x.scratch.sb3':
        return true;
    }
    return false;
};

const createMainWindow = () => {
    const window = createWindow({
        width: defaultSize.width,
        height: defaultSize.height,
        title: 'Scratch Desktop'
    });
    const webContents = window.webContents;

    webContents.session.on('will-download', (ev, item) => {
        const isProjectSave = getIsProjectSave(item);
        const itemPath = item.getFilename();
        const baseName = path.basename(itemPath);
        const extName = path.extname(baseName);
        const options = {
            defaultPath: baseName
        };
        if (extName) {
            const extNameNoDot = extName.replace(/^\./, '');
            options.filters = [getFilterForExtension(extNameNoDot)];
        }
        const userChosenPath = dialog.showSaveDialogSync(window, options);
        if (userChosenPath) {
            // WARNING: `setSavePath` on this item is only valid during the `will-download` event. Calling the async
            // version of `showSaveDialog` means the event will finish before we get here, so `setSavePath` will be
            // ignored. For that reason we need to call `showSaveDialogSync` above.
            item.setSavePath(userChosenPath);
            if (isProjectSave) {
                const newProjectTitle = path.basename(userChosenPath, extName);
                webContents.send('setTitleFromSave', {title: newProjectTitle});

                // "setTitleFromSave" will set the project title but GUI has already reported the telemetry event
                // using the old title. This call lets the telemetry client know that the save was actually completed
                // and the event should be committed to the event queue with this new title.
                telemetry.projectSaveCompleted(newProjectTitle);
            }
        } else {
            item.cancel();
            if (isProjectSave) {
                telemetry.projectSaveCanceled();
            }
        }
    });

    webContents.on('will-prevent-unload', ev => {
        const choice = dialog.showMessageBoxSync(window, {
            type: 'question',
            message: 'Leave Scratch?',
            detail: 'Any unsaved changes will be lost.',
            buttons: ['Stay', 'Leave'],
            cancelId: 0, // closing the dialog means "stay"
            defaultId: 0 // pressing enter or space without explicitly selecting something means "stay"
        });
        const shouldQuit = (choice === 1);
        if (shouldQuit) {
            ev.preventDefault();
        }
    });

    window.once('ready-to-show', () => {
        window.show();
    });

    return window;
};

if (process.platform === 'darwin') {
    const osxMenu = Menu.buildFromTemplate(MacOSMenu(app));
    Menu.setApplicationMenu(osxMenu);
} else {
    // disable menu for other platforms
    Menu.setApplicationMenu(null);
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
    app.quit();
});

app.on('will-quit', () => {
    telemetry.appWillClose();
});

// work around https://github.com/MarshallOfSound/electron-devtools-installer/issues/122
// which seems to be a result of https://github.com/electron/electron/issues/19468
if (process.platform === 'win32') {
    const appUserDataPath = app.getPath('userData');
    const devToolsExtensionsPath = path.join(appUserDataPath, 'DevTools Extensions');
    try {
        fs.unlinkSync(devToolsExtensionsPath);
    } catch (_) {
        // don't complain if the file doesn't exist
    }
}

// create main BrowserWindow when electron is ready
app.on('ready', () => {
    if (isDevelopment) {
        import('electron-devtools-installer').then(importedModule => {
            const {default: installExtension, ...devToolsExtensions} = importedModule;
            const extensionsToInstall = [
                devToolsExtensions.REACT_DEVELOPER_TOOLS,
                devToolsExtensions.REACT_PERF,
                devToolsExtensions.REDUX_DEVTOOLS
            ];
            for (const extension of extensionsToInstall) {
                // WARNING: depending on a lot of things including the version of Electron `installExtension` might
                // return a promise that never resolves, especially if the extension is already installed.
                installExtension(extension).then(
                    // eslint-disable-next-line no-console
                    extensionName => console.log(`Installed dev extension: ${extensionName}`),
                    // eslint-disable-next-line no-console
                    errorMessage => console.error(`Error installing dev extension: ${errorMessage}`)
                );
            }
        });
    }

    _windows.main = createMainWindow();
    _windows.main.on('closed', () => {
        delete _windows.main;
    });
    _windows.about = createAboutWindow();
    _windows.about.on('close', event => {
        event.preventDefault();
        _windows.about.hide();
    });
});

ipcMain.on('open-about-window', () => {
    _windows.about.show();
});
