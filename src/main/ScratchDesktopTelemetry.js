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

export default ScratchDesktopTelemetry;
