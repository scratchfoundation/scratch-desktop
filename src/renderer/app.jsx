import {ipcRenderer, remote} from 'electron';
import bindAll from 'lodash.bindall';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import GUI from 'scratch-gui/src/index';
import GUIComponent from 'scratch-gui/src/components/gui/gui.jsx';

import AppStateHOC from 'scratch-gui/src/lib/app-state-hoc.jsx';
import {
    LoadingStates,
    onFetchedProjectData,
    onLoadedProject,
    defaultProjectId,
    requestNewProject,
    requestProjectUpload,
    setProjectId
} from 'scratch-gui/src/reducers/project-state';
import {
    openLoadingProject,
    closeLoadingProject,
    openTelemetryModal
} from 'scratch-gui/src/reducers/modals';

import ElectronStorageHelper from '../common/ElectronStorageHelper';

import showPrivacyPolicy from './showPrivacyPolicy';
import styles from './app.css';

const appTarget = document.getElementById('app');
appTarget.className = styles.app || 'app';

GUI.setAppElement(appTarget);

/**
 * Higher-order component to add desktop logic to AppStateHOC.
 * @param {Component} WrappedComponent - an AppStateHOC-like component to wrap.
 * @returns {Component} - a component similar to AppStateHOC with desktop-specific logic added.
 */
const ScratchDesktopAppStateHOC = function (WrappedComponent) {
    const ScratchDesktopAppStateComponent = function (props) {
        const shouldShowTelemetryModal = (typeof ipcRenderer.sendSync('getTelemetryDidOptIn') !== 'boolean');

        return (<WrappedComponent
            showTelemetryModal={shouldShowTelemetryModal}

            // allow passed-in props to override any of the above
            {...props}
        />);
    };

    return ScratchDesktopAppStateComponent;
};

/**
 * Higher-order component to add desktop logic to the GUI.
 * @param {Component} WrappedComponent - a GUI-like component to wrap.
 * @returns {Component} - a component similar to GUI with desktop-specific logic added.
 */
const ScratchDesktopGUIHOC = function (WrappedComponent) {
    class ScratchDesktopGUIComponent extends React.Component {
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
                // use `sendSync` because this should be set before first render
                telemetryDidOptIn: ipcRenderer.sendSync('getTelemetryDidOptIn')
            };
            this.props.onLoadingStarted();
            ipcRenderer.invoke('get-initial-project-data').then(initialProjectData => {
                const hasInitialProject = initialProjectData && (initialProjectData.length > 0);
                this.props.onHasInitialProject(hasInitialProject, this.props.loadingState);
                if (!hasInitialProject) {
                    this.props.onLoadingCompleted();
                    return;
                }
                this.props.vm.loadProject(initialProjectData).then(
                    () => {
                        this.props.onLoadingCompleted();
                        this.props.onLoadedProject(this.props.loadingState, true);
                    },
                    e => {
                        this.props.onLoadingCompleted();
                        this.props.onLoadedProject(this.props.loadingState, false);
                        remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                            type: 'error',
                            title: 'Failed to load project',
                            message: 'Invalid or corrupt project file.',
                            detail: e.message
                        });

                        // this effectively sets the default project ID
                        // TODO: maybe setting the default project ID should be implicit in `requestNewProject`
                        this.props.onHasInitialProject(false, this.props.loadingState);

                        // restart as if we didn't have an initial project to load
                        this.props.onRequestNewProject();
                    }
                );
            });
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
            ipcRenderer.invoke('getTelemetryDidOptIn').then(telemetryDidOptIn => {
                this.setState({telemetryDidOptIn});
            });
        }
        handleTelemetryModalOptOut () {
            ipcRenderer.send('setTelemetryDidOptIn', false);
            ipcRenderer.invoke('getTelemetryDidOptIn').then(telemetryDidOptIn => {
                this.setState({telemetryDidOptIn});
            });
        }
        handleUpdateProjectTitle (newTitle) {
            this.setState({projectTitle: newTitle});
        }
        render () {
            const shouldShowTelemetryModal = (typeof this.state.telemetryDidOptIn !== 'boolean');

            const childProps = omit(this.props, Object.keys(ScratchDesktopGUIComponent.propTypes));

            return (<WrappedComponent
                canEditTitle
                canModifyCloudData={false}
                canSave={false}
                isScratchDesktop
                isTelemetryEnabled={this.state.telemetryDidOptIn}
                showTelemetryModal={shouldShowTelemetryModal}
                onClickAbout={[
                    {
                        title: 'About',
                        onClick: () => this.handleClickAbout()
                    },
                    {
                        title: 'Privacy Policy',
                        onClick: () => showPrivacyPolicy()
                    },
                    {
                        title: 'Data Settings',
                        onClick: () => this.props.onTelemetrySettingsClicked()
                    }
                ]}
                onProjectTelemetryEvent={this.handleProjectTelemetryEvent}
                onShowPrivacyPolicy={showPrivacyPolicy}
                onStorageInit={this.handleStorageInit}
                onTelemetryModalOptIn={this.handleTelemetryModalOptIn}
                onTelemetryModalOptOut={this.handleTelemetryModalOptOut}
                onUpdateProjectTitle={this.handleUpdateProjectTitle}

                // allow passed-in props to override any of the above
                {...childProps}
            />);
        }
    }

    ScratchDesktopGUIComponent.propTypes = {
        loadingState: PropTypes.oneOf(LoadingStates),
        onFetchedInitialProjectData: PropTypes.func,
        onHasInitialProject: PropTypes.func,
        onLoadedProject: PropTypes.func,
        onLoadingCompleted: PropTypes.func,
        onLoadingStarted: PropTypes.func,
        onRequestNewProject: PropTypes.func,
        onTelemetrySettingsClicked: PropTypes.func,
        // using PropTypes.instanceOf(VM) here will cause prop type warnings due to VM mismatch
        vm: GUIComponent.WrappedComponent.propTypes.vm
    };
    const mapStateToProps = state => {
        const loadingState = state.scratchGui.projectState.loadingState;
        return {
            loadingState: loadingState,
            vm: state.scratchGui.vm
        };
    };
    const mapDispatchToProps = dispatch => ({
        onLoadingStarted: () => dispatch(openLoadingProject()),
        onLoadingCompleted: () => dispatch(closeLoadingProject()),
        onHasInitialProject: (hasInitialProject, loadingState) => {
            if (hasInitialProject) {
                // emulate sb-file-uploader
                return dispatch(requestProjectUpload(loadingState));
            }

            // `createProject()` might seem more appropriate but it's not a valid state transition here
            // setting the default project ID is a valid transition from NOT_LOADED and acts like "create new"
            return dispatch(setProjectId(defaultProjectId));
        },
        onFetchedInitialProjectData: (projectData, loadingState) =>
            dispatch(onFetchedProjectData(projectData, loadingState)),
        onLoadedProject: (loadingState, loadSuccess) => {
            const canSaveToServer = false;
            return dispatch(onLoadedProject(loadingState, canSaveToServer, loadSuccess));
        },
        onRequestNewProject: () => dispatch(requestNewProject(false)),
        onTelemetrySettingsClicked: () => dispatch(openTelemetryModal())
    });

    return connect(mapStateToProps, mapDispatchToProps)(ScratchDesktopGUIComponent);
};

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGui = compose(
    ScratchDesktopAppStateHOC,
    AppStateHOC,
    ScratchDesktopGUIHOC
)(GUI);

export default <WrappedGui />;
