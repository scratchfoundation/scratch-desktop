const fs = require('fs');
const https = require('https');
const path = require('path');
const {pipeline} = require('stream');
const util = require('util');

const async = require('async');

const libraries = require('./lib/libraries');

const ASSET_HOST = 'cdn.assets.scratch.mit.edu';
const NUM_SIMULTANEOUS_DOWNLOADS = 5;
const OUT_PATH = path.resolve('static', 'fetched');


const describe = function (object) {
    return util.inspect(object, false, Infinity, true);
};

const collectSimple = function (library, dest, debugLabel = 'Item') {
    library.forEach(item => {
        let md5Count = 0;
        if (item.md5) {
            ++md5Count;
            dest.add(item.md5);
        }
        if (item.baseLayerMD5) { // 2.0 library syntax for costumes
            ++md5Count;
            dest.add(item.baseLayerMD5);
        }
        if (item.md5ext) { // 3.0 library syntax for costumes
            ++md5Count;
            dest.add(item.md5ext);
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

const collectAssets = function (dest) {
    collectSimple(libraries.backdrops, dest, 'Backdrop');
    collectSimple(libraries.costumes, dest, 'Costume');
    collectSimple(libraries.sounds, dest, 'Sound');
    libraries.sprites.forEach(sprite => {
        if (sprite.costumes) {
            collectSimple(sprite.costumes, dest, `Costume for sprite ${sprite.name}`);
        }
        if (sprite.sounds) {
            collectSimple(sprite.sounds, dest, `Sound for sprite ${sprite.name}`);
        }
    });
    return dest;
};

const connectionPool = [];

const fetchAsset = function (md5, callback) {
    // Assets are content-addressable: filename == md5 of content. If a file
    // is already on disk under its md5 name, its bytes are by definition the
    // correct bytes, so no checksum verification is needed.
    const destPath = path.resolve(OUT_PATH, md5);
    if (fs.existsSync(destPath)) {
        callback();
        return;
    }
    // Download to a .tmp path and rename atomically once the write stream
    // has fully flushed. An interrupted fetch leaves only the .tmp file,
    // which the existence check above does not see, so a partial download
    // can never satisfy the cache on a future run.
    const tmpPath = `${destPath}.tmp`;
    const myAgent = connectionPool.pop() || new https.Agent({keepAlive: true});
    const getOptions = {
        host: ASSET_HOST,
        path: `/internalapi/asset/${md5}/get/`,
        agent: myAgent
    };
    const urlHuman = `//${getOptions.host}${getOptions.path}`;
    // The three convergent termination paths (request error, non-200 status,
    // pipeline completion) all run finish(err?). The once-guard ensures the
    // user's callback fires exactly once even if more than one path triggers
    // (e.g., a late socket error after a response has been received). On
    // error, the agent is destroyed instead of being returned to the pool:
    // its keep-alive socket may be in a degraded state and reusing it would
    // cascade failures into subsequent fetches.
    let settled = false;
    const finish = err => {
        if (settled) return;
        settled = true;
        if (err) {
            myAgent.destroy();
            callback(err);
            return;
        }
        connectionPool.push(myAgent);
        fs.rename(tmpPath, destPath, renameErr => {
            if (renameErr) {
                callback(renameErr);
                return;
            }
            console.log(`Fetched ${urlHuman}`);
            callback();
        });
    };
    const request = https.get(getOptions, response => {
        if (response.statusCode !== 200) {
            // Drain the response body so the socket isn't held open by
            // unconsumed bytes before the agent is destroyed.
            response.resume();
            finish(new Error(`Request failed: status code ${response.statusCode} for ${urlHuman}`));
            return;
        }
        // pipeline() handles backpressure, propagates errors from either end
        // of the chain (response stream or write stream), and invokes the
        // callback exactly once. No manual data/end/finish/error wiring.
        const stream = fs.createWriteStream(tmpPath, {encoding: 'binary'});
        pipeline(response, stream, finish);
    });
    request.on('error', finish);
};

const pruneStaleAssets = function (validNames) {
    let pruned = 0;
    for (const file of fs.readdirSync(OUT_PATH)) {
        if (validNames.has(file)) continue;
        // Tolerate non-file entries (directories, OS metadata, permission
        // surprises) so a single bad entry doesn't abort the whole prune.
        try {
            fs.unlinkSync(path.resolve(OUT_PATH, file));
            ++pruned;
        } catch (err) {
            console.warn(`Could not prune ${file}: ${err.message}`);
        }
    }
    if (pruned > 0) {
        console.log(`Pruned ${pruned} stale file(s) from ${OUT_PATH}`);
    }
};

const fetchAllAssets = function () {
    // Ensure OUT_PATH exists. The script is self-contained: callers don't
    // need to create the directory first.
    fs.mkdirSync(OUT_PATH, {recursive: true});
    const allAssets = collectAssets(new Set());
    console.log(`Total library assets: ${allAssets.size}`);

    async.forEachLimit(allAssets, NUM_SIMULTANEOUS_DOWNLOADS, fetchAsset, err => {
        if (err) {
            console.error(`Fetch failed:\n${describe(err)}`);
        } else {
            console.log('Fetch succeeded.');
            // Only prune after a successful fetch. Pruning on partial
            // failure could delete an asset we needed but couldn't
            // re-fetch this run.
            pruneStaleAssets(allAssets);
        }

        console.log(`Shutting down ${connectionPool.length} agents.`);
        while (connectionPool.length > 0) {
            connectionPool.pop().destroy();
        }
    });
};

fetchAllAssets();
