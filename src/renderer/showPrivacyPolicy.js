import {ipcRenderer} from 'electron';

const showPrivacyPolicy = event => {
    if (event) {
        // Probably a click on a link; don't actually follow the link in the `href` attribute.
        event.preventDefault();
    }
    // tell the main process to open the privacy policy window
    ipcRenderer.send('open-privacy-policy-window');
    return false;
};

export default showPrivacyPolicy;
