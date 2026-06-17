import fs from 'fs';

let content = fs.readFileSync('i18n.ts', 'utf-8');
content = content.replace(
    "import { sandbox5Locales } from './sandbox5Locales';",
    "import { sandbox5Locales } from './sandbox5Locales';\nimport { sandbox6Locales } from './sandbox6Locales';"
);
content = content.replace(
    "sandbox5: sandbox5Locales.en,",
    "sandbox5: sandbox5Locales.en,\n        sandbox6: sandbox6Locales.en,"
);
content = content.replace(
    "sandbox5: sandbox5Locales.es,",
    "sandbox5: sandbox5Locales.es,\n        sandbox6: sandbox6Locales.es,"
);
content = content.replace(
    "sandbox5: sandbox5Locales.it,",
    "sandbox5: sandbox5Locales.it,\n        sandbox6: sandbox6Locales.it,"
);
content = content.replace(
    "sandbox5: sandbox5Locales.he,",
    "sandbox5: sandbox5Locales.he,\n        sandbox6: sandbox6Locales.he,"
);

fs.writeFileSync('i18n.ts', content);
console.log("Patched i18n.ts");
