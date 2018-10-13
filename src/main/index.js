import {app, BrowserWindow} from 'electron';
import * as path from 'path';
import {format as formatUrl} from 'url';

import installExtension, {REACT_DEVELOPER_TOOLS} from 'electron-devtools-installer';

const isDevelopment = process.env.NODE_ENV !== 'production';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;

const createMainWindow = () => {
    const window = new BrowserWindow({
        width: 1096,
        height: 715,
        useContentSize: true
    });

    if (isDevelopment) {
        window.webContents.openDevTools();
        installExtension(REACT_DEVELOPER_TOOLS);
        // TODO: add logging package and bring back the lines below
        // .then(name => console.log(`Added Extension:  ${name}`))
        // .catch(err => console.log('An error occurred: ', err));
    }

    if (isDevelopment) {
        window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
    } else {
        window.loadURL(formatUrl({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file',
            slashes: true
        }));
    }

    window.on('closed', () => {
        mainWindow = null;
    });

    window.webContents.on('devtools-opened', () => {
        window.focus();
        setImmediate(() => {
            window.focus();
        });
    });

    return window;
};

// quit application when all windows are closed
app.on('window-all-closed', () => {
    // on macOS it is common for applications to stay open until the user explicitly quits
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // on macOS it is common to re-create a window even after all windows have been closed
    if (mainWindow === null) {
        mainWindow = createMainWindow();
    }
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
    mainWindow = createMainWindow();
});
