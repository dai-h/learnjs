module.exports = {
    "env": {
        "browser": true,
        "jasmine": true,
        "jquery": true,
        "node": true
    },
    "extends": ["eslint:recommended", "plugin:jasmine/recommended"],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
    },
    "plugins": ["jasmine", "jquery"]
};