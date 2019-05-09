module.exports = {
  globals: {
    cfg: true,
    oracledb: true,
    converters: true,
  },
  extends: [
    "airbnb-base",
  ],
  rules: {
    "prefer-destructuring": 0,
    "import/no-dynamic-require": 0,
    "no-console": 0,
    "no-continue": 0,
    "global-require": 0,
    "func-names": 0,
    "max-len": [1, 160],
    "no-await-in-loop": 0,
    "no-param-reassign": 0,
  },
};
