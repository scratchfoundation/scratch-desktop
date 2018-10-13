module.exports = {
    root: true,
    env: {
        browser: true,
        node: true
    },
    extends: ['scratch', 'scratch/es6', 'scratch/react'],
    settings: {
        react: {
            version: '16.2' // Prevent 16.3 lifecycle method errors
        }
    }
};
