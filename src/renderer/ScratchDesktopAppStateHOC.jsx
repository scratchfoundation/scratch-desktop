import {ipcRenderer} from 'electron';
import bindAll from 'lodash.bindall';
import React from 'react';

/**
 * Higher-order component to add desktop logic to AppStateHOC.
 * @param {Component} WrappedComponent - an AppStateHOC-like component to wrap.
 * @returns {Component} - a component similar to AppStateHOC with desktop-specific logic added.
 */
const ScratchDesktopAppStateHOC = function (WrappedComponent) {
    class ScratchDesktopAppStateComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'handleTelemetryModalOptIn',
                'handleTelemetryModalOptOut'
            ]);
            this.state = {
                // use `sendSync` because this should be set before first render
                telemetryDidOptIn: ipcRenderer.sendSync('getTelemetryDidOptIn')
            };
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
        render () {
            const shouldShowTelemetryModal = (typeof ipcRenderer.sendSync('getTelemetryDidOptIn') !== 'boolean');

            return (<WrappedComponent
                isTelemetryEnabled={this.state.telemetryDidOptIn}
                onTelemetryModalOptIn={this.handleTelemetryModalOptIn}
                onTelemetryModalOptOut={this.handleTelemetryModalOptOut}
                showTelemetryModal={shouldShowTelemetryModal}

                // allow passed-in props to override any of the above
                {...this.props}
            />);
        }
    }

    return ScratchDesktopAppStateComponent;
};

export default ScratchDesktopAppStateHOC;
