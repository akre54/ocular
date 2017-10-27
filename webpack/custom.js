const {resolve} = require('path');
module.exports = dirPath => {

  try {
    return require(resolve(dirPath, 'webpack.config.js'));
  } catch (e) {
    return {};
  }

};
