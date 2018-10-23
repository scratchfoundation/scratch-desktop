module.exports = {
    root: true,
    env: {
        node: true
    },
    extends: ['scratch', 'scratch/es6'],
    globals: {
        __static: false // electron-webpack provides this constant to access bundled static assets
    }
};
