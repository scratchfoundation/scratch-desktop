import {ipcRenderer} from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';
import GUI, {AppStateHOC} from 'scratch-gui';

import ElectronStorageHelper from '../common/ElectronStorageHelper';

import styles from './app.css';

const defaultProjectId = 0;

const captureClick = function (ev) {
    for (const element of ev.path) {
        if (element.href) {
            // prevent clicking links
            // this is a last-resort test: if we get here that means there's work to do in the GUI
            console.warn(`Suppressing click on link to ${element.href}`);
            ev.preventDefault();
            ev.stopPropagation();
            return false;
        }
    }
};
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', captureClick, true);
});

// Register "base" page view
// analytics.pageview('/');

const appTarget = document.getElementById('app');
appTarget.className = styles.app || 'app'; // TODO
document.body.appendChild(appTarget);

GUI.setAppElement(appTarget);
const WrappedGui = AppStateHOC(GUI);

const onStorageInit = storageInstance => {
    storageInstance.addHelper(new ElectronStorageHelper(storageInstance));
    // storageInstance.addOfficialScratchWebStores(); // TODO: do we want this?
};

const guiProps = {
    onStorageInit,
    isScratchDesktop: true,
    projectId: defaultProjectId,
    showTelemetryModal: (typeof ipcRenderer.sendSync('getTelemetryDidOptIn')) !== 'boolean',
    onTelemetryModalOptIn: () => {
        ipcRenderer.send('setTelemetryDidOptIn', true);
    },
    onTelemetryModalOptOut: () => {
        ipcRenderer.send('setTelemetryDidOptIn', false);
    },
    onProjectTelemetryEvent: (event, metadata) => {
        ipcRenderer.send(event, metadata);
    }
};
const wrappedGui = React.createElement(WrappedGui, guiProps);
ReactDOM.render(wrappedGui, appTarget);
