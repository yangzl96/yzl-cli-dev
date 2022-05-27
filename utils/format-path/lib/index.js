'use strict';

const path = require('path')

function formatPath(p) {
  if (p && typeof p === 'string') {
    // 获取分隔符 win: \ ，mac: /
    const sep = path.sep
    if (sep === '/') {
      return p
    } else {
      return p.replace(/\\/g, '/')
    }
  }
}

module.exports = formatPath;
