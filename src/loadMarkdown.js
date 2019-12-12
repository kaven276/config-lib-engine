const marked = require('marked');

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

module.exports = loadMarkdown;
