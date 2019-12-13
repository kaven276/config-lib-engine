const Validator = require('fastest-validator');

const v = new Validator();

const nameGradeCheck = v.compile({
  name: { type: 'string', min: 2, max: 255 },
  grade: { type: 'enum', values: ['A', 'B', 'C'] },
});

const connectionCheck = v.compile({
  connection: {
    type: 'object',
    props: {
      port: { type: 'number', min: 1, max: 65535 },
      host: 'string',
    },
  },
});

function wrapThrow(fn) {
  return (cfg) => {
    const result = fn(cfg);
    if (result !== true) {
      throw result;
    }
  };
}

// 书写 validator
// 可以不同的文件，不同的文件内容，应用不同的 validator
exports.validator = (filename) => {
  switch (filename) {
    case 'json':
      return wrapThrow(nameGradeCheck);
    case 'object':
      return wrapThrow(connectionCheck);
    default:
      return () => {};
  }
};
