import React from 'react';
import ReactDOM from 'react-dom';
import GUI, {AppStateHOC} from 'scratch-gui';

import ElectronStorageHelper from '../common/ElectronStorageHelper';

import styles from './app.css';

const defaultProjectId = 0;

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
    projectId: defaultProjectId
};
const wrappedGui = React.createElement(WrappedGui, guiProps);
ReactDOM.render(wrappedGui, appTarget);
