const fs = require('fs');
const https = require('https');
const path = require('path');
const util = require('util');

const async = require('async');

const libraries = require('./lib/libraries');

const ASSET_HOST = 'cdn.assets.scratch.mit.edu';
const NUM_SIMULTANEOUS_DOWNLOADS = 5;
const OUT_PATH = path.resolve('static', 'assets');


const describe = function (object) {
    return util.inspect(object, false, Infinity, true);
};

const collectSimple = function (library, debugLabel = 'Item', dest = new Set()) {
    library.forEach(item => {
        let md5Count = 0;
        if (item.md5) {
            ++md5Count;
            dest.add(item.md5);
        }
        if (item.baseLayerMD5) {
            ++md5Count;
            dest.add(item.baseLayerMD5);
        }
        if (md5Count < 1) {
            console.warn(`${debugLabel} has no MD5 property:\n${describe(item)}`);
        } else if (md5Count > 1) {
            // is this actually bad?
            console.warn(`${debugLabel} has multiple MD5 properties:\n${describe(item)}`);
        }
    });
    return dest;
};

const collectAssets = function (dest = new Set()) {
    collectSimple(libraries.backdrops, 'Backdrop', dest);
    collectSimple(libraries.costumes, 'Costume', dest);
    collectSimple(libraries.sounds, 'Sound', dest);
    libraries.sprites.forEach(sprite => {
        if (sprite.md5) {
            dest.add(sprite.md5);
        } else {
            console.warn(`Sprite has no MD5 property:\n${describe(sprite)}`);
        }
        if (sprite.json.costumes) {
            collectSimple(sprite.json.costumes, `Costume for sprite ${sprite.name}`);
        }
        if (sprite.json.sounds) {
            collectSimple(sprite.json.sounds, `Sound for sprite ${sprite.name}`);
        }
    });
    return dest;
};

const connectionPool = [];

const fetchAsset = function (md5, callback) {
    const myAgent = connectionPool.pop() || new https.Agent({keepAlive: true});
    const getOptions = {
        host: ASSET_HOST,
        path: `/internalapi/asset/${md5}/get/`,
        agent: myAgent
    };
    const urlHuman = `//${getOptions.host}${getOptions.path}`;
    https.get(getOptions, response => {
        if (response.statusCode !== 200) {
            callback(new Error(`Request failed: status code ${response.statusCode} for ${urlHuman}`));
            return;
        }

        const stream = fs.createWriteStream(path.resolve(OUT_PATH, md5), {encoding: 'binary'});
        stream.on('error', callback);
        response.on('data', chunk => {
            stream.write(chunk);
        });
        response.on('end', () => {
            connectionPool.push(myAgent);
            stream.end();
            console.log(`Fetched ${urlHuman}`);
            callback();
        });
    });
};

const fetchAllAssets = function () {
    const allAssets = collectAssets();
    console.log(`Total library assets: ${allAssets.size}`);

    async.forEachLimit(allAssets, NUM_SIMULTANEOUS_DOWNLOADS, fetchAsset, err => {
        if (err) {
            console.error(`Fetch failed:\n${describe(err)}`);
        } else {
            console.log('Fetch succeeded.');
        }

        console.log(`Shutting down ${connectionPool.length} agents.`);
        while (connectionPool.length > 0) {
            connectionPool.pop().destroy();
        }
    });
};

fetchAllAssets();
