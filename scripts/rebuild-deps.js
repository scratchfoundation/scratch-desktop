const fs = require('fs');

const desktopPackage = require('../package.json');
const desktopRawPackage = require('../package-deps.json');
const guiPackage = require('../node_modules/scratch-gui/package.json');

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

desktopPackage.devDependencies = sortObject(Object.assign(
    {},
    guiPackage.devDependencies,
    desktopRawPackage.devDependencies
));

let newDesktopPackage = JSON.stringify(desktopPackage, null, 2);
newDesktopPackage += '\n';
fs.writeFileSync('package.json', newDesktopPackage);
