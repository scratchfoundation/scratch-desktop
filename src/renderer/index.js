// this is an async import so that it doesn't block the first render
// index.html contains a loading/splash screen which will display while this import loads

const route = new URLSearchParams(window.location.search).get('route') || 'app';
switch (route) {
case 'app':
    import('./app.jsx');
    break;
case 'about':
    import('./about.jsx');
    break;
}
