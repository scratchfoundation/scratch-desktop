import React from 'react';
import ReactDOM from 'react-dom';
import {productName, version} from '../../package.json';

import logo from '../icon/ScratchDesktop.svg';
import styles from './about.css';

// TODO: localization?
const AboutElement = () => (
    <div className={styles.aboutBox}>
        <div><img
            alt={`${productName} icon`}
            src={logo}
            className={styles.aboutLogo}
        /></div>
        <div className={styles.aboutText}>
            <h2>{productName}</h2>
            <div>Version {version}</div>
            <table className={styles.aboutDetails}>
                {
                    ['Electron', 'Chrome'].map(component => {
                        const componentVersion = process.versions[component.toLowerCase()];
                        return <tr key={component}><td>{component}</td><td>{componentVersion}</td></tr>;
                    })
                }
            </table>
        </div>
    </div>
);

const appTarget = document.getElementById('app');
ReactDOM.render(<AboutElement />, appTarget);
