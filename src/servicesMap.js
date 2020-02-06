// NOTICE: all file path operation use nodejs Path API, so posix/win32 will all do right

const chokidar = require('chokidar');
const YAML = require('js-yaml');
const fs = require('fs');
const Path = require('path');
const loadMarkdown = require('./loadMarkdown.js');
const json5 = require('json5');
const getFileCount = require('./scanFiles.js');

const dirMap = new Map();
const registry = {}; // form configs registry
const configDir = `${process.env.CONFIG_DIR || Path.join(process.cwd(), 'services')}/`;
let countDown = getFileCount(configDir);

function setRegPosix(path, obj) {
  registry[path] = obj;
}
function setRegWin32(path, obj) {
  registry[path.replace(/\\/g, '/')] = obj;
}
const setReg = (Path.sep === '/') ? setRegPosix : setRegWin32;

// load dir module first, the dir/config.js will replace dir module
function processDir(event, path) {
  if (event !== 'addDir') return false;
  let dirConfig;
  if (path === '') {
    dirConfig = Object.create({ // root config.js inherit nothing or anything in future
      index: subMap => subMap,
    });
  // eslint-disable-next-line no-constant-condition
  } else if (true) { // dirConfig not prototyped to higher dirConfig
    dirConfig = Object.create({});
  } else {
    const upPath = path.substr(0, path.lastIndexOf('/'));
    const upDirConfig = dirMap.get(upPath);
    dirConfig = Object.create(upDirConfig);
  }
  Object.defineProperty(dirConfig, 'subMap', {
    value: {},
    configurable: false,
    writable: false,
    readable: true,
    enumerable: false,
  });
  dirMap.set(path, dirConfig);
  setReg(`/${path}/`, dirConfig);
  // eslint-disable-next-line no-use-before-define
  processDirConfig('addWithDir', Path.join(path, 'config.js'));
  return true;
}

function processDirConfig(event, path) {
  const filename = Path.basename(path);
  if (filename !== 'config.js') return false;
  const dirPath = Path.dirname(path);
  const dirConfig = dirMap.get(dirPath);
  const requirePath = Path.join(configDir, path);
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
      return true;
    }
    Object.assign(dirConfig, newConfig); // update dirConfig
  }
  return true;
}

function processConfigModule(event, path, purePath, parse, text) {
  let data;
  try {
    data = parse(text);
  } catch (e) {
    console.error(`validate failed for /${path}`);
    console.error(e);
    process.exit(1);
  }
  // get dirConfig
  let upPath = Path.dirname(path);
  if (upPath === '.') { // if path like filename.ext, then Path.dirname will get . not ''
    upPath = '';
  }
  const fileName = Path.basename(purePath);
  const upDirConfig = dirMap.get(upPath);
  const upDirSubMap = upDirConfig.subMap;
  if (event === 'unlink') {
    delete upDirSubMap[fileName];
  } else {
    upDirSubMap[fileName] = data;
  }

  // validation
  let sanitizedData;
  if (upDirConfig && upDirConfig.validator) {
    try {
      sanitizedData = upDirConfig.validator(fileName, data)(data);
    } catch (e) {
      console.error(`validate failed for /${path}`);
      // console.error(JSON.stringify(e, null, 2));
      console.error(e);
      // throw new Error();
      process.exit(1);
    }
  }
  setReg(`/${purePath}`, sanitizedData || data);
}

function processConfigModuleTypes(event, path) {
  const requirePath = Path.join(configDir, path);
  const suffix = Path.extname(path);
  if (!suffix.match(/.(yml|yaml|md|markdown|json|json5)/)) return false;
  const filename = Path.basename(path, suffix);
  if (filename === 'README') return false;
  const pathPure = Path.join(Path.dirname(path), filename);
  let text;
  switch (event) {
    case 'add': // 发现新配置文件
    case 'change': // 发现配置文件变化
      text = fs.readFileSync(requirePath, {
        encoding: 'utf8',
      });
      switch (suffix.substr(1)) {
        case 'yml':
        case 'yaml':
          processConfigModule(event, path, pathPure, YAML.load, text);
          break;
        case 'md':
        case 'markdown':
          processConfigModule(event, path, pathPure, loadMarkdown, text);
          break;
        case 'json':
          processConfigModule(event, path, pathPure, JSON.parse, text);
          break;
        case 'json5':
          processConfigModule(event, path, pathPure, json5.parse, text);
          break;
        default:
      }
      break;
    case 'unlink': // 删除配置文件则关闭对应的 pool
      processConfigModule(event, pathPure);
      break;
    default:
  }
  return true;
}

chokidar
  .watch(configDir, {
    cwd: configDir,
    disableGlobbing: true, // (default: false) .watch() and .add() are treated as literal path names
    // depth: 5, // (default: undefined). If set, limits how many levels of subdirectories will be traversed
    awaitWriteFinish: true,
  })
  .on('all', (event, path) => {
    // console.log(event, path);
    if (processDir(event, path)) {
      // do nothing
    } else if (processDirConfig(event, path)) {
      // do nothing
    } else {
      processConfigModuleTypes(event, path);
    }
    if (event === 'add' || event === 'addDir') {
      countDown -= 1;
      if (countDown === 0) {
        if (module === require.main) {
          // console.log('after scan all dir/file, quit');
          process.exit(0);
        } else if (process.send) {
          // console.log('all config loaded and passed validation, pm2 serve ready!');
          process.send('ready');
        }
      }
    }
  }).on('ready', () => {
    if (!module.parent.id.endsWith('server.js')) {
      process.exit(0);
    }
  });

exports.configMap = registry;
