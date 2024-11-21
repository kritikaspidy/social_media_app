const fs = require('fs');

function readFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading file from disk: ${err}`);
        return [];
    }
}

function writeFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(`Error writing file to disk: ${err}`);
    }
}

module.exports = { readFile, writeFile };
