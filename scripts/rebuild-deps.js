const fs = require('fs');

const desktopPackage = require('../package.json');
const desktopRawPackage = require('../package-deps.json');
const guiPackage = require('scratch-gui/package.json');

/**
 * Sort an object's keys.
 * @param {object} obj - the object whose keys should be sorted.
 * @returns {object} - a new object with the same keys and values, but the keys are sorted by {@link Array#sort}.
 */
const sortObject = obj => Object
    .keys(obj)
    .sort()
    .reduce(
        (accumulator, currentKey) => {
            accumulator[currentKey] = obj[currentKey];
            return accumulator;
        },
        {}
    );

/**
 * Make a shallow comparison of two objects, returning true if they match. This shallow comparison returns true iff:
 * - the two objects have the same number of keys, AND
 * - each key of obj1 is present in obj2 (via hasOwnProperty), AND
 * - the value associated with each key in obj1 matches (using ===) the value associated with the same key in obj2
 * Note that the order of keys is not compared.
 * @param {object} obj1 - the first object to compare
 * @param {object} obj2 - the second object to compare
 * @returns {boolean} - true if the objects are shallow-identical.
 */
const shallowCompare = (obj1, obj2) =>
    Object.keys(obj1).length === Object.keys(obj2).length &&
    Object.keys(obj1).every(k => Object.prototype.hasOwnProperty.call(obj2, k) && (obj1[k] === obj2[k]));

/**
 * Merge `scratch-gui` and `scratch-desktop` dependencies:
 * 1. Merge the dependencies found in `scratch-gui/package.json` with those in `package-deps.json`.
 * 2. Report statistics.
 * 3. If the result differs from `package.json`, rewrite `package.json` with the new dependencies and print a warning.
 */
const rebuildDeps = () => {
    const oldDevDependencies = desktopPackage.devDependencies;
    desktopPackage.devDependencies = sortObject(Object.assign(
        {},
        guiPackage.devDependencies,
        desktopRawPackage.devDependencies
    ));

    console.log(`Direct dependencies (desktop / gui / merged): ${
        Object.keys(desktopRawPackage.devDependencies).length} / ${
        Object.keys(guiPackage.devDependencies).length} / ${
        Object.keys(desktopPackage.devDependencies).length}`);
    if (shallowCompare(oldDevDependencies, desktopPackage.devDependencies)) {
        console.log('Dependencies in package.json were already up-to-date.');
    } else {
        let newDesktopPackage = JSON.stringify(desktopPackage, null, 2);
        newDesktopPackage += '\n';
        fs.writeFileSync('package.json', newDesktopPackage);
        console.warn(
            '\n', // NPM adds a prefix to all BUT the first line, so this makes the remaining lines format correctly
            '***\n',
            '*** Dependencies in package.json have been updated! Please re-run npm to install these updates.\n',
            '***\n'
        );
    }
};

rebuildDeps();
