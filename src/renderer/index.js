// This file does async imports of the heavy JSX, especially app.jsx, to avoid blocking the first render.
// The main index.html just contains a loading/splash screen which will display while this import loads.

import {ipcRenderer} from 'electron';

ipcRenderer.on('ready-to-show', () => {
    // Start without any element in focus, otherwise the first link starts with focus and shows an orange box.
    // We shouldn't disable that box or the focus behavior in case someone wants or needs to navigate that way.
    // This seems like a hack... maybe there's some better way to do avoid any element starting with focus?
    document.activeElement.blur();
});

const route = new URLSearchParams(window.location.search).get('route') || 'app';
switch (route) {
case 'app':
    import('./app.jsx'); // eslint-disable-line no-unused-expressions
    break;
case 'about':
    import('./about.jsx'); // eslint-disable-line no-unused-expressions
    break;
case 'privacy':
    import('./privacy.jsx');
    break;
}
