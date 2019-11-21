import {ipcRenderer, remote, shell} from 'electron';
import bindAll from 'lodash.bindall';
import fs from 'fs';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {compose} from 'redux';
import GUI, {AppStateHOC, TitledHOC} from 'scratch-gui';

import ElectronStorageHelper from '../common/ElectronStorageHelper';

import styles from './app.css';

const defaultProjectId = 0;

// TODO: switch from "sendSync" to "invoke" once we're using Electron 7+
// note that doing so will require fixing up usage to deal with a promise
const mainProcessArgs = ipcRenderer.sendSync('get-args');

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
                'handleTelemetryModalOptOut'
            ]);
            this.state = {
                // projectPath is used as "do we want to wait for a project file to load?"
                projectPath: mainProcessArgs.projectPath,
                projectData: null
            };
        }
        componentDidMount () {
            ipcRenderer.on('setTitleFromSave', this.handleSetTitleFromSave);
            if (this.state.projectPath) {
                fs.readFile(this.state.projectPath, null, (err, data) => {
                    if (err) {
                        remote.dialog.showMessageBox({
                            type: 'error',
                            title: 'Failed to load project',
                            message: `Could not load project from file:\n${this.state.projectPath}`,
                            detail: err.message,
                            buttons: ['OK']
                        });
                        // just open a blank editor
                        this.setState({projectPath: null});
                    } else {
                        // render the GUI with the now-loaded project data
                        this.setState({projectData: data});
                    }
                });
            }
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
            this.props.onUpdateProjectTitle(args.title);
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
        render () {
            if (this.state.projectPath && !this.state.projectData) {
                return <p className="splash">Loading File...</p>;
            }
            const shouldShowTelemetryModal = (typeof ipcRenderer.sendSync('getTelemetryDidOptIn') !== 'boolean');
            return (<WrappedComponent
                isScratchDesktop
                projectId={defaultProjectId}
                showTelemetryModal={shouldShowTelemetryModal}
                onClickLogo={this.handleClickLogo}
                onProjectTelemetryEvent={this.handleProjectTelemetryEvent}
                onStorageInit={this.handleStorageInit}
                onTelemetryModalOptIn={this.handleTelemetryModalOptIn}
                onTelemetryModalOptOut={this.handleTelemetryModalOptOut}

                // completely omit the projectData prop if the projectData state is empty
                // passing an empty projectData causes a GUI error
                {...(this.state.projectData ? {projectData: this.state.projectData} : {})}

                // allow passed-in props to override any of the above
                {...this.props}
            />);
        }
    }

    ScratchDesktopComponent.propTypes = {
        onUpdateProjectTitle: PropTypes.func
    };

    return ScratchDesktopComponent;
};

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGui = compose(
    AppStateHOC,
    TitledHOC,
    ScratchDesktopHOC // must come after `TitledHOC` so it has access to `onUpdateProjectTitle`
)(GUI);

ReactDOM.render(<WrappedGui />, appTarget);
