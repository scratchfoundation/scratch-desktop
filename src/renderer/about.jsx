import React from 'react';
import ReactDOM from 'react-dom';

const AboutElement = () => (
    <h1>About</h1>
);

const appTarget = document.getElementById('app');
ReactDOM.render(<AboutElement />, appTarget);
