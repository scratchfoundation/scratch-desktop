import React from 'react';
import ReactDOM from 'react-dom';

import GUI, {AppStateHOC} from 'scratch-gui';
import styles from 'scratch-gui/src/playground/index.css';

import ElectronStorageHelper from '../common/ElectronStorageHelper';

// Register "base" page view
// analytics.pageview('/');

const appTarget = document.getElementById('app');
appTarget.className = styles.app || 'app'; // TODO
document.body.appendChild(appTarget);

GUI.setAppElement(appTarget);
const WrappedGui = AppStateHOC(GUI);

if (process.env.NODE_ENV === 'production' && typeof window === 'object') {
    // Warn before navigating away
    window.onbeforeunload = () => true;
}

const onStorageInit = storageInstance => {
    storageInstance.addHelper(new ElectronStorageHelper(storageInstance));
    // storageInstance.addOfficialScratchWebStores(); // TODO: do we want this?
};

const wrappedGui = React.createElement(WrappedGui, {onStorageInit});
ReactDOM.render(wrappedGui, appTarget);
