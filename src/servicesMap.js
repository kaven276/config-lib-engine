const chokidar = require('chokidar');
const YAML = require('js-yaml');
const fs = require('fs');
const join = require('path').join;
const marked = require('marked');
const json5 = require('json5');

const markedOptions = ({
  renderer: new marked.Renderer(),
  pedantic: false,
  gfm: true,
  tables: true,
  breaks: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false,
});

const dirMap = new Map();
const registry = {}; // form configs registry
const configDir = join(__dirname, '../services/');

function defaultIndex() {
  return this.subMap;
}

// load dir module first, the dir/config.js will replace dir module
function processDir(event, path) {
  if (event !== 'addDir') return false;
  let dirConfig;
  if (path === '') {
    dirConfig = Object.create({ // root config.js inherit nothing or anything in future
      index: defaultIndex,
    });
  } else {
    const upPath = path.substr(0, path.lastIndexOf('/'));
    const upDirConfig = dirMap.get(upPath);
    dirConfig = Object.create(upDirConfig);
  }
  dirConfig.subMap = {};
  dirMap.set(path, dirConfig);
  registry[`/${path}/`] = dirConfig;
  // eslint-disable-next-line no-use-before-define
  processDirConfig('addWithDir', `${path}/config.js`);
  return true;
}

function processDirConfig(event, path) {
  const matchDirConfig = path.match(/^(.+)(\/config\.js)$/);
  if (!matchDirConfig) return false;
  const dirPath = matchDirConfig[1];
  const dirConfig = dirMap.get(dirPath);
  const requirePath = configDir + path;
  if (event === 'change' || event === 'unlink') {
    Object.keys(dirConfig).forEach((n) => {
      delete dirConfig[n];
    });
    const absPath = require.resolve(requirePath);
    if (absPath) {
      delete require.cache[absPath];
    } else {
      console.error('no absPath');
    }
  }
  let newConfig;
  if (event === 'change' || event === 'add' || event === 'addWithDir') {
    try {
      newConfig = require(requirePath);
    } catch (e) {
      if (event !== 'addWithDir') {
        console.error('module change load/hot-reload error', path, e);
      }
    }
    Object.assign(dirConfig, newConfig); // update dirConfig
  }
  return true;
}

function processConfigModule(event, purePath, data) {
  // get dirConfig
  // const upPath = path.substr(0, path.lastIndexOf('/'));
  const match = purePath.match((/^(.*?)(\/?)([^/]+)$/));
  const upPath = match[1] || '';
  const fileName = match[3];
  const upDirConfig = dirMap.get(upPath);
  const upDirSubMap = upDirConfig.subMap;
  if (event === 'unlink') {
    delete upDirSubMap[fileName];
  } else {
    upDirSubMap[fileName] = data;
  }
  registry[`/${purePath}`] = data;
  // validation
  if (upDirConfig && upDirConfig.validator) {
    try {
      upDirConfig.validator(fileName, data)(data);
    } catch (e) {
      console.error(`validate failed for /${purePath}`);
      // console.error(JSON.stringify(e, null, 2));
      console.error(e);
      // throw new Error();
    }
  }
}

function loadMarkdown(text) {
  const lexer = new marked.Lexer(markedOptions);
  const tokens = lexer.lex(text);
  // console.log(tokens);
  const table = tokens.filter(item => item.type === 'table')[0];
  const header = table.header.map((v) => {
    const vv = v.split(':');
    return {
      key: vv[0],
      type: vv[1],
    };
  });
  const data = table.cells.map(row => row.reduce((obj, col, idx) => {
    const hc = header[idx];
    obj[hc.key] = (hc.type && hc.type.startsWith('num')) ? Number(col) : col;
    return obj;
  }, {}));
  return data;
}

chokidar
  .watch(configDir, {
    cwd: configDir,
    disableGlobbing: false,
    depth: 1,
    awaitWriteFinish: true,
  })
  .on('all', (event, path) => {
    // console.log(event, path);
    if (processDir(event, path)) return;
    if (processDirConfig(event, path)) return;
    const requirePath = configDir + path;
    const match = path.match(/^(.+)\.(yml|yaml|md|markdown|json|json5)$/);
    if (!match) return;
    if (match[1].endsWith('README')) return;
    const pathPure = match[1];
    const suffix = match[2];
    // console.log(configName, suffix);
    let text;
    switch (event) {
      case 'add': // 发现新配置文件
      case 'change': // 发现配置文件变化
        text = fs.readFileSync(requirePath, {
          encoding: 'utf8',
        });
        switch (suffix) {
          case 'yml':
          case 'yaml':
            processConfigModule(event, pathPure, YAML.load(text));
            break;
          case 'md':
          case 'markdown':
            processConfigModule(event, pathPure, loadMarkdown(text));
            break;
          case 'json':
            processConfigModule(event, pathPure, JSON.parse(text));
            break;
          case 'json5':
            processConfigModule(event, pathPure, json5.parse(text));
            break;
          default:
        }
        break;
      case 'unlink': // 删除配置文件则关闭对应的 pool
        processConfigModule(event, pathPure);
        break;
      default:
    }
  });

exports.configMap = registry;
