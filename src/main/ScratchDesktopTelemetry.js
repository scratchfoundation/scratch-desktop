import {app, ipcMain} from 'electron';

import TelemetryClient from './telemetry/TelemetryClient';

const EVENT_TEMPLATE = {
    version: '3.0.0',
    projectName: '',
    language: '',
    scriptCount: -1,
    spriteCount: -1,
    variablesCount: -1,
    blocksCount: -1,
    costumesCount: -1,
    listsCount: -1,
    soundsCount: -1
};

const APP_ID = 'scratch-desktop';
const APP_VERSION = app.getVersion();
const APP_INFO = Object.freeze({
    projectName: `${APP_ID} ${APP_VERSION}`
});

class ScratchDesktopTelemetry {
    constructor () {
        this._telemetryClient = new TelemetryClient();
    }

    get didOptIn () {
        return this._telemetryClient.didOptIn;
    }
    set didOptIn (value) {
        this._telemetryClient.didOptIn = value;
    }

    appWasOpened () {
        this._telemetryClient.addEvent('app::open', {...EVENT_TEMPLATE, ...APP_INFO});
    }

    appWillClose () {
        this._telemetryClient.addEvent('app::close', {...EVENT_TEMPLATE, ...APP_INFO});
    }

    projectDidLoad (metadata = {}) {
        this._telemetryClient.addEvent('project::load', {...EVENT_TEMPLATE, ...metadata});
    }

    projectDidSave (metadata = {}) {
        this._telemetryClient.addEvent('project::save', {...EVENT_TEMPLATE, ...metadata});
    }

    projectWasCreated (metadata = {}) {
        this._telemetryClient.addEvent('project::create', {...EVENT_TEMPLATE, ...metadata});
    }

    projectWasUploaded (metadata = {}) {
        this._telemetryClient.addEvent('project::upload', {...EVENT_TEMPLATE, ...metadata});
    }
}

// make a singleton so it's easy to share across both Electron processes
const scratchDesktopTelemetrySingleton = new ScratchDesktopTelemetry();

ipcMain.on('getTelemetryDidOptIn', event => {
    event.returnValue = scratchDesktopTelemetrySingleton.didOptIn;
});
ipcMain.on('setTelemetryDidOptIn', (event, arg) => {
    scratchDesktopTelemetrySingleton.didOptIn = arg;
});
ipcMain.on('projectDidLoad', (event, arg) => {
    scratchDesktopTelemetrySingleton.projectDidLoad(arg);
});
ipcMain.on('projectDidSave', (event, arg) => {
    scratchDesktopTelemetrySingleton.projectDidSave(arg);
});
ipcMain.on('projectWasCreated', (event, arg) => {
    scratchDesktopTelemetrySingleton.projectWasCreated(arg);
});
ipcMain.on('projectWasUploaded', (event, arg) => {
    scratchDesktopTelemetrySingleton.projectWasUploaded(arg);
});

export default scratchDesktopTelemetrySingleton;
