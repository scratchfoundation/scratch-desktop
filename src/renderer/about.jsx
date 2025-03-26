import React from 'react';
import packageJson from '../../package.json';

import logo from '../icon/ScratchDesktop.svg';
import styles from './about.css';

const AboutElement = () => (
    <div className={styles.aboutBox}>
        <div><img
            alt={`${packageJson.productName} icon`}
            src={logo}
            className={styles.aboutLogo}
        /></div>
        <div className={styles.aboutText}>
            <h2>{packageJson.productName}</h2>
            Version {packageJson.version}
            <table className={styles.aboutDetails}><tbody>
                {
                    ['Electron', 'Chrome', 'Node'].map(component => {
                        const componentVersion = process.versions[component.toLowerCase()];
                        return <tr key={component}><td>{component}</td><td>{componentVersion}</td></tr>;
                    })
                }
            </tbody></table>
        </div>
    </div>
);

export default <AboutElement />;
