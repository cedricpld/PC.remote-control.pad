const path = require('path');

// Cette ligne est la plus importante : elle garantit que le .exe
// cherchera le config.json dans son propre dossier.
process.chdir(path.dirname(process.execPath));

// On lance ensuite le serveur qui a été compilé par "npm run build"
require('./dist/server/server.cjs');