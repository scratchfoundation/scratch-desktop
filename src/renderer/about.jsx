import React from 'react';
import ReactDOM from 'react-dom';
import {productName, version} from '../../package.json';

import logo from '../icon/ScratchDesktop.svg';

// TODO: localization?
const AboutElement = () => (
    <div
        style={{
            color: 'white',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: 'bolder',
            margin: 0,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        }}
    >
        <div><img
            alt={`${productName} icon`}
            src={logo}
            style={{
                maxWidth: '10rem',
                maxHeight: '10rem'
            }}
        /></div>
        <h2>{productName}</h2>
        <div>Version {version}</div>
        <table style={{fontSize: 'x-small'}}>
            {
                ['Electron', 'Chrome'].map(component => {
                    const componentVersion = process.versions[component.toLowerCase()];
                    return <tr key={component}><td>{component}</td><td>{componentVersion}</td></tr>;
                })
            }
        </table>
    </div>
);

const appTarget = document.getElementById('app');
ReactDOM.render(<AboutElement />, appTarget);
