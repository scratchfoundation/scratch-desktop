import React from 'react';
import ReactDOM from 'react-dom';

import GUI, {AppStateHOC} from 'scratch-gui/src/index';

// Register "base" page view
// analytics.pageview('/');

const appTarget = document.createElement('div');
// appTarget.className = styles.app;
document.body.appendChild(appTarget);

GUI.setAppElement(appTarget);
const WrappedGui = AppStateHOC(GUI);

// TODO a hack for testing the backpack, allow backpack host to be set by url param
const backpackHostMatches = window.location.href.match(/[?&]backpack_host=([^&]*)&?/);
const backpackHost = backpackHostMatches ? backpackHostMatches[1] : null;

const backpackOptions = {
    visible: true,
    host: backpackHost
};
if (process.env.NODE_ENV === 'production' && typeof window === 'object') {
    // Warn before navigating away
    window.onbeforeunload = () => true;
}

ReactDOM.render(<WrappedGui backpackOptions={backpackOptions} />, appTarget);
