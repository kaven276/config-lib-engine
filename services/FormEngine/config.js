// 用于验证融合产品配置结构是否正确

const { struct } = require('superstruct');

const configValicator = struct.interface({
  itemList: [
    {
      itemCode: 'string',
      itemLabel: 'string',
      toTable: struct.enum([0, 1, 9]),
      readonly: struct.enum([0, 1]),
      inputType: struct.enum([
        'select',
        'number',
        'text',
        'email',
        'date',
        'time',
        'datetime-local',
        'textarea',
      ]), // 使用何种 html 录入方式
      optional: struct.enum([0, 1]),
      optionList: struct.optional([
        {
          // 选项列表
          fieldCode: 'string',
          fieldText: 'string',
        },
      ]),
      defaultFieldCode: 'string', // 默认选项
      defaultText: 'string', // 默认手填值
    },
  ],
});

// 可以不同的文件，不同的文件内容，应用不同的 validator
// eslint-disable-next-line no-unused-vars
exports.validator = (filename, config) => configValicator;
//  configValidator(productConfig);

