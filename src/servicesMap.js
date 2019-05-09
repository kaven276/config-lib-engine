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

const lexer = new marked.Lexer(markedOptions);
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
    const requirePath = configDir + path;
    const match = path.match(/^(.+)\.(yml|yaml|md|markdown|json5)$/);
    if (!match) return;
    const configName = `/${match[1]}`;
    if (configName.endsWith('README')) return;
    const suffix = match[2];
    // console.log(configName, suffix);
    let text;
    let productConfig;
    switch (event) {
      case 'add': // 发现新配置文件
      case 'change': // 发现配置文件变化
        text = fs.readFileSync(requirePath, {
          encoding: 'utf8',
        });
        switch (suffix) {
          case 'yml':
          case 'yaml':
            productConfig = YAML.load(text);
            registry[configName] = productConfig;
            break;
          case 'md':
          case 'markdown':
            registry[configName] = (() => {
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
            })();
            break;
          case 'json5':
            registry[configName] = json5.parse(text);
            break;
          default:
        }
        break;
      case 'unlink': // 删除配置文件则关闭对应的 pool
        delete registry[configName];
        break;
      default:
    }
  });

exports.configMap = registry;
