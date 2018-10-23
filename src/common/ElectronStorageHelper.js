const fs = require('fs');
const path = require('path');

const staticAssets = path.resolve(__static, 'assets');

/**
 * Allow the storage module to load files bundled in the Electron application.
 */
class ElectronStorageHelper {
    constructor (storageInstance) {
        this.parent = storageInstance;
    }

    /**
     * Fetch an asset but don't process dependencies.
     * @param {AssetType} assetType - The type of asset to fetch.
     * @param {string} assetId - The ID of the asset to fetch: a project ID, MD5, etc.
     * @param {DataFormat} dataFormat - The file format / file extension of the asset to fetch: PNG, JPG, etc.
     * @return {Promise.<Asset>} A promise for the contents of the asset.
     */
    load (assetType, assetId, dataFormat) {
        assetId = path.basename(assetId);
        dataFormat = path.basename(dataFormat);

        return new Promise((resolve, reject) => {
            fs.readFile(
                path.resolve(staticAssets, `${assetId}.${dataFormat}`),
                (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(new this.parent.Asset(assetType, assetId, dataFormat, data));
                    }
                }
            );
        });
    }
}

module.exports = ElectronStorageHelper;
