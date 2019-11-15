module.exports = {
    "env": {
        "browser": true,
        "jasmine": true,
        "node": true,
        "es6": true
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
    "plugins": ["jasmine"]
};