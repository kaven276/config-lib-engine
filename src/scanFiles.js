const sh = require('shelljs');

function getFileCount(pathPrefix) {
  let count = 0;
  sh.cd(pathPrefix);
  sh.find('.').forEach(() => {
    count += 1;
  });
  return count;
}

module.exports = getFileCount;

