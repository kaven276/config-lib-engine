const chokidar = require('chokidar');
const YAML = require('js-yaml');
const fs = require('fs');
const join = require('path').join;

const registry = {}; // form configs registry
const configDir = join(__dirname, '../services/');

chokidar
  .watch(configDir, {
    cwd: configDir,
    disableGlobbing: false,
    depth: 1,
    awaitWriteFinish: true,
  })
  .on('all', (event, path) => {
    // console.log(event, path);
    if (!path.match(/\w+\.yml$/)) return;
    const requirePath = configDir + path;
    const configName = `/${path.replace(/^(.+)\.yml$/, '$1')}`;
    let productConfig;
    switch (event) {
      case 'add': // 发现新配置文件
      case 'change': // 发现配置文件变化
        productConfig = YAML.load(fs.readFileSync(requirePath, {
          encoding: 'utf8',
        }));
        registry[configName] = productConfig;
        break;
      case 'unlink': // 删除配置文件则关闭对应的 pool
        delete registry[configName];
        break;
      default:
    }
  });

exports.configMap = registry;
