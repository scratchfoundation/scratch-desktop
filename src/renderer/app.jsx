import {ipcRenderer} from 'electron';
import bindAll from 'lodash.bindall';
import React from 'react';
import ReactDOM from 'react-dom';
import GUI, {AppStateHOC} from 'scratch-gui';

import ElectronStorageHelper from '../common/ElectronStorageHelper';

import showPrivacyPolicy from './showPrivacyPolicy';
import styles from './app.css';

const defaultProjectId = 0;

const appTarget = document.getElementById('app');
appTarget.className = styles.app || 'app';

GUI.setAppElement(appTarget);

const ScratchDesktopHOC = function (WrappedComponent) {
    class ScratchDesktopComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'handleProjectTelemetryEvent',
                'handleSetTitleFromSave',
                'handleStorageInit',
                'handleTelemetryModalOptIn',
                'handleTelemetryModalOptOut',
                'handleUpdateProjectTitle'
            ]);
            this.state = {
                projectTitle: null
            };
        }
        componentDidMount () {
            ipcRenderer.on('setTitleFromSave', this.handleSetTitleFromSave);
        }
        componentWillUnmount () {
            ipcRenderer.removeListener('setTitleFromSave', this.handleSetTitleFromSave);
        }
        handleClickAbout () {
            ipcRenderer.send('open-about-window');
        }
        handleProjectTelemetryEvent (event, metadata) {
            ipcRenderer.send(event, metadata);
        }
        handleSetTitleFromSave (event, args) {
            this.handleUpdateProjectTitle(args.title);
        }
        handleStorageInit (storageInstance) {
            storageInstance.addHelper(new ElectronStorageHelper(storageInstance));
        }
        handleTelemetryModalOptIn () {
            ipcRenderer.send('setTelemetryDidOptIn', true);
        }
        handleTelemetryModalOptOut () {
            ipcRenderer.send('setTelemetryDidOptIn', false);
        }
        handleUpdateProjectTitle (newTitle) {
            this.setState({projectTitle: newTitle});
        }
        render () {
            const shouldShowTelemetryModal = (typeof ipcRenderer.sendSync('getTelemetryDidOptIn') !== 'boolean');
            return (<WrappedComponent
                canEditTitle
                isScratchDesktop
                canSave={false}
                projectId={defaultProjectId}
                projectTitle={this.state.projectTitle}
                showTelemetryModal={shouldShowTelemetryModal}
                onClickAbout={this.handleClickAbout}
                onProjectTelemetryEvent={this.handleProjectTelemetryEvent}
                onShowPrivacyPolicy={showPrivacyPolicy}
                onStorageInit={this.handleStorageInit}
                onTelemetryModalOptIn={this.handleTelemetryModalOptIn}
                onTelemetryModalOptOut={this.handleTelemetryModalOptOut}
                onUpdateProjectTitle={this.handleUpdateProjectTitle}
                {...this.props}
            />);
        }
    }

    return ScratchDesktopComponent;
};

const WrappedGui = ScratchDesktopHOC(AppStateHOC(GUI));

ReactDOM.render(<WrappedGui />, appTarget);
