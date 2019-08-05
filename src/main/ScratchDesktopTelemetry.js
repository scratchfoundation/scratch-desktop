import {app, ipcMain} from 'electron';
import defaultsDeep from 'lodash.defaultsdeep';
import {version} from '../../package.json';

import TelemetryClient from './telemetry/TelemetryClient';

const EVENT_TEMPLATE = {
    version,
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
        // Since the save dialog appears on the main process the GUI does not wait for the actual save to complete.
        // That means the GUI sends this event before we know the file name used for the save, which is where the new
        // project title comes from. Instead, just hold on to this metadata pending a `projectSaveCompleted` event
        // from the save code on the main process. If the user cancels the save this data will be cleared.
        this._pendingProjectSave = metadata;
    }

    projectSaveCompleted (newProjectTitle) {
        const metadata = this._pendingProjectSave;
        this._pendingProjectSave = null;

        metadata.projectName = newProjectTitle;
        this._telemetryClient.addEvent('project::save', this._buildMetadata(metadata));
    }

    projectSaveCanceled () {
        this._pendingProjectSave = null;
    }

    projectWasCreated (metadata = {}) {
        this._telemetryClient.addEvent('project::create', this._buildMetadata(metadata));
    }

    projectWasUploaded (metadata = {}) {
        this._telemetryClient.addEvent('project::upload', this._buildMetadata(metadata));
    }

    _buildMetadata (metadata) {
        const {projectName, language, ...codeMetadata} = metadata;
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
