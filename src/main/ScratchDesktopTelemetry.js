import {app, ipcMain} from 'electron';

import TelemetryClient from './telemetry/TelemetryClient';

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
        this._telemetryClient.addEvent('app::open', APP_INFO);
    }

    appWillClose () {
        this._telemetryClient.addEvent('app::close', APP_INFO);
    }

    projectDidLoad (metadata = {}) {
        this._telemetryClient.addEvent('project::load', metadata);
    }

    projectDidSave (metadata = {}) {
        this._telemetryClient.addEvent('project::save', metadata);
    }

    projectWasCreated (metadata = {}) {
        this._telemetryClient.addEvent('project::create', metadata);
    }

    projectWasUploaded (metadata = {}) {
        this._telemetryClient.addEvent('project::upload', metadata);
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
