const path = require('path');

// Corrige le chemin pour que l'exe trouve config.json
process.chdir(path.dirname(process.execPath));

// Lance le serveur compilé
require('./dist/server/production.cjs');