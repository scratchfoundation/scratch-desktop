import {ipcMain} from 'electron';

import TelemetryClient from './telemetry/TelemetryClient';

const info = {
    projectName: 'fake project data for telemetry client test',
    language: 'en',
    scriptCount: 42,
    spriteCount: 42,
    variablesCount: 42,
    blocksCount: 42,
    costumesCount: 42,
    listsCount: 42,
    soundsCount: 42
};

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
        this._telemetryClient.addEvent('app::open', info);
    }

    appWillClose () {
        this._telemetryClient.addEvent('app::close', info);
    }

    projectDidLoad () {
        this._telemetryClient.addEvent('project::load', info);
    }

    projectDidSave () {
        this._telemetryClient.addEvent('project::save', info);
    }

    projectWasCreated () {
        this._telemetryClient.addEvent('project::create', info);
    }

    projectWasUploaded () {
        this._telemetryClient.addEvent('project::upload', info);
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

export default scratchDesktopTelemetrySingleton;
