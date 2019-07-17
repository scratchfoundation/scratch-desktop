import {app, ipcMain} from 'electron';
import defaultsDeep from 'lodash.defaultsdeep';

import TelemetryClient from './telemetry/TelemetryClient';

const EVENT_TEMPLATE = {
    version: '3.0.0',
    projectName: '',
    language: '',
    metadata: {
        scriptCount: -1,
        spriteCount: -1,
        variablesCount: -1,
        blocksCount: -1,
        costumesCount: -1,
        listsCount: -1,
        soundsCount: -1
    }
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
        this._telemetryClient.addEvent('project::load', this._buildMetadata(metadata));
    }

    projectDidSave (metadata = {}) {
        this._telemetryClient.addEvent('project::save', this._buildMetadata(metadata));
    }

    projectWasCreated (metadata = {}) {
        this._telemetryClient.addEvent('project::create', this._buildMetadata(metadata));
    }

    projectWasUploaded (metadata = {}) {
        this._telemetryClient.addEvent('project::upload', this._buildMetadata(metadata));
    }

    _buildMetadata (metadata) {
        const { projectName, language, ...codeMetadata } = metadata;
        return defaultsDeep({
            projectName,
            language,
            metadata: codeMetadata
        }, EVENT_TEMPLATE);
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
