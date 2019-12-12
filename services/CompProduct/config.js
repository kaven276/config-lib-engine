
// 用于验证融合产品配置结构是否正确

const { struct } = require('superstruct');

const rhProductValicator = struct.interface({
  sysCode: struct.enum(['CBS', 'BSS']),
  mixNetType: 'string',
  // name: 'string',
  // desc: 'string?',
  // xxProductId: 'string',
  // cbProductId: 'string',
  useCase: ['string', 'string'],
  xxProductId: 'string',
  xxProductName: 'string',
  xxProdName: 'string?',
  cbProductId: 'string',
  allowFromProducts: ['string', 'string'],
  members: [{
    type: 'string',
    netTypeCode: 'string',
    min: 'number',
    max: 'number',
    aopHidePackages: struct.enum([undefined, 0, 1]),
    bundleList: struct.optional([{
      bundleId: 'string',
      bundleName: 'string',
      bdlName: 'string?',
      speedLevel: 'string?',
      // feeMode: 'string',
      // addType: 'string',
      allowAdd: 'number',
      allowNew: 'number',
      products: struct.optional([{
        productId: 'string',
        productMode: 'string',
        close2g: struct.enum([undefined, 0, 1]),
        packages: struct.optional([{
          packageId: 'string',
          elementId: 'string',
          elementType: struct.enum(['D', 'S']), // # D-资费 S-服务
        }]),
      }]),
      activities: struct.optional([{
        actPlanId: 'string',
      }]),
    }]),
  }],
});

// 书写配置清单服务
// 注意：exports.index 不能使用箭头函数，因为 this 指向是由平台指定的
exports.index = subMap =>
  // eslint-disable-next-line no-unused-vars
  Object.entries(subMap).map(([k, v]) => ({
    fileName: k,
    productName: v.xxProductName,
  }));

// 书写 validator
// 可以不同的文件，不同的文件内容，应用不同的 validator
// eslint-disable-next-line no-unused-vars
exports.validator = (filename, config) => rhProductValicator;

