import React, {useEffect, useState} from 'react';
import {ipcRenderer} from 'electron';

import styles from './usb.css';

const UsbElement = () => {
    const [deviceList, setDeviceList] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);

    useEffect(() => {
        const listener = (_event, usbDeviceList) => {
            setDeviceList(usbDeviceList);
            if (!usbDeviceList.some(device => device.deviceId === selectedDeviceId)) {
                setSelectedDeviceId(null);
            }
        };

        ipcRenderer.on('usb-device-list', listener);

        return () => ipcRenderer.removeListener('usb-device-list', listener);
    }, []);

    const selectHandler = deviceId => () => {
        setSelectedDeviceId(deviceId);
    };

    const deviceHandler = deviceId => () => {
        ipcRenderer.send('usb-device-selected', deviceId);
        setSelectedDeviceId(null);
    };

    return (
        <main>
            Select your USB device:
            <fieldset
                className={styles.devices}
            >
                {deviceList.map(device => (
                    <div
                        className={`${styles.device} ${selectedDeviceId === device.deviceId ? styles.selected : ''}`}
                        key={device.deviceId}
                    >
                        <input
                            checked={selectedDeviceId === device.deviceId}
                            id={`device-${device.deviceId}`}
                            name="usbDevice"
                            onChange={selectHandler(device.deviceId)}
                            type="radio"
                            value={device.deviceId}
                        />
                        <label htmlFor={`device-${device.deviceId}`}>{device.productName}</label>
                    </div>
                ))}
            </fieldset>
            <div className={styles.buttons}>
                <button
                    className={styles.cancelButton}
                    onClick={deviceHandler(null)}
                >Cancel</button>
                <button
                    className={styles.connectButton}
                    disabled={!selectedDeviceId}
                    onClick={deviceHandler(selectedDeviceId)}
                >Connect</button>
            </div>
        </main>
    );
};

export default <UsbElement />;
