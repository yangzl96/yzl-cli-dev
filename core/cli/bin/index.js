#! /usr/bin/env node

const importLocal = require('import-local')

if (importLocal(__filename)) {
  // 执行本地安装的
  require('npmlog').info('cli', '正在使用 yzl-cli 本地版本')
} else {
  // 执行全局导出的
  require('../lib')(process.argv.slice(2))
}