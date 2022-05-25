'use strict';

module.exports = core;

const semver = require('semver')
const colors = require('colors')
const pkg = require('../package.json')
const log = require('@yzl-cli-dev/log')
const constant = require('./const')

function core() {
  try {
    checkNodeVersion()
    checkRoot()
  } catch (error) {
    log.error(error.message)
  }
}

// 检查版本号
function checkPkgVersion() {
  log.notice('cli', pkg.version)
}

// 检查Node版本
function checkNodeVersion() {
  // 当前版本号
  const currentVersion = process.version
  const lowestVersion = constant.LOWEST_NODE_VERSION
  // 比对最低版本号
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(colors.red(`yzl-cli 需要安装 v${lowestVersion} 以上版本的 Node.js`))
  }
}

// 检查root账户 是否是root账户启动
// process.geteuid 不支持windows
function checkRoot() {
  // 命令：sudo yzl-cli-dev
  // console.log(process.geteuid())
  // root账户是 geteuid 0 
  // 如果是root账户创建的文件，那么其他用户就无法修改文件了，出现权限报错的问题
  // 所以这里要做一个降级

  // 注意这里如果node版本是13.2以下的，那么是没有esm的
  // 13.2以下需要babel cjs转换 esm ，以上的话需要配置 package.json type:module
  // 同时这个 root-check2.0.0用的esm，所以建议安装1.0.0

  const rootCheck = require('root-check')
  rootCheck()
  console.log('root-check success')
}