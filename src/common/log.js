import minilog from 'minilog';
minilog.enable();

const namespace = (() => {
    switch (process.type) {
    case 'browser': return 'main';
    case 'renderer': return 'web';
    default: return process.type; // probably 'worker' for a web worker
    }
})();

export default minilog(`app-${namespace}`);
