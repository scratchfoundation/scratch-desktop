import {BrowserWindow, Menu, app, dialog, ipcMain} from 'electron';
import * as path from 'path';
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
        ...browserWindowOptions
    });
    const webContents = window.webContents;

    if (isDevelopment) {
        webContents.openDevTools();
        import('electron-devtools-installer').then(importedModule => {
            const {default: installExtension, REACT_DEVELOPER_TOOLS} = importedModule;
            installExtension(REACT_DEVELOPER_TOOLS);
            // TODO: add logging package and bring back the lines below
            // .then(name => console.log(`Added browser extension:  ${name}`))
            // .catch(err => console.log('An error occurred: ', err));
        });
    }

    webContents.on('devtools-opened', () => {
        window.focus();
        setImmediate(() => {
            window.focus();
        });
    });

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
        const userChosenPath = dialog.showSaveDialog(window, options);
        if (userChosenPath) {
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
        const choice = dialog.showMessageBox(window, {
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
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
    app.quit();
});

app.on('will-quit', () => {
    telemetry.appWillClose();
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
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
