import {ipcRenderer, shell} from 'electron';
import bindAll from 'lodash.bindall';
import React from 'react';
import ReactDOM from 'react-dom';
import {compose} from 'redux';
import GUI, {AppStateHOC} from 'scratch-gui';

import ElectronStorageHelper from '../common/ElectronStorageHelper';

import styles from './app.css';

const defaultProjectId = 0;

// override window.open so that it uses the OS's default browser, not an electron browser
window.open = function (url, target) {
    if (target === '_blank') {
        shell.openExternal(url);
    }
};
// Register "base" page view
// analytics.pageview('/');

const appTarget = document.getElementById('app');
appTarget.className = styles.app || 'app'; // TODO
document.body.appendChild(appTarget);

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
                projectTitle: null,
                projectLoading: true
            };

            ipcRenderer.invoke('get-initial-project-data').then(projectData => {
                this.setState({
                    projectData,
                    projectLoading: false
                });
            });
        }
        componentDidMount () {
            ipcRenderer.on('setTitleFromSave', this.handleSetTitleFromSave);
        }
        componentWillUnmount () {
            ipcRenderer.removeListener('setTitleFromSave', this.handleSetTitleFromSave);
        }
        handleClickLogo () {
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

            if (this.state.projectLoading) {
                return <p className="splash">Loading File...</p>;
            }

            return (<WrappedComponent
                canEditTitle
                isScratchDesktop
                projectId={defaultProjectId}
                projectTitle={this.state.projectTitle}
                showTelemetryModal={shouldShowTelemetryModal}
                onClickLogo={this.handleClickLogo}
                onProjectTelemetryEvent={this.handleProjectTelemetryEvent}
                onStorageInit={this.handleStorageInit}
                onTelemetryModalOptIn={this.handleTelemetryModalOptIn}
                onTelemetryModalOptOut={this.handleTelemetryModalOptOut}
                onUpdateProjectTitle={this.handleUpdateProjectTitle}

                // completely omit the projectData prop if we have no project data
                // passing an empty projectData causes a GUI error
                {...(this.state.projectData ? {projectData: this.state.projectData} : {})}

                // allow passed-in props to override any of the above
                {...this.props}
            />);
        }
    }

    return ScratchDesktopComponent;
};

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGui = compose(
    ScratchDesktopHOC,
    AppStateHOC
)(GUI);

ReactDOM.render(<WrappedGui />, appTarget);
