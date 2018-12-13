import {BrowserWindow, app, dialog} from 'electron';
import * as path from 'path';
import {format as formatUrl} from 'url';

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
        import('electron-devtools-installer').then(importedModule => {
            const {default: installExtension, REACT_DEVELOPER_TOOLS} = importedModule;
            installExtension(REACT_DEVELOPER_TOOLS);
            // TODO: add logging package and bring back the lines below
            // .then(name => console.log(`Added Extension:  ${name}`))
            // .catch(err => console.log('An error occurred: ', err));
        });
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
    mainWindow.webContents.on('will-prevent-unload', ev => {
        const choice = dialog.showMessageBox(mainWindow, {
            type: 'question',
            buttons: ['Stay', 'Leave'],
            message: 'Leave Scratch?',
            cancelId: 0, // closing the dialog means "stay"
            defaultId: 0, // pressing enter or space without explicitly selecting something means "stay"
            detail: 'Any unsaved changes will be lost.'
        });
        const shouldQuit = (choice === 1);
        if (shouldQuit) {
            ev.preventDefault();
        }
    });
});
