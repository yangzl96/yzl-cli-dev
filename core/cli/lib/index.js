'use strict';

module.exports = core;

const path = require('path')
const semver = require('semver')
const colors = require('colors')
const userHome = require('user-home');
const pathExists = require('path-exists').sync
const pkg = require('../package.json')
const log = require('@yzl-cli-dev/log')
const constant = require('./const')

// 参数
let args

async function core() {
  try {
    checkInputArgs()
    checkEnv()
    checkGlobalUpdate()
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

// 检查用户主目录
function checkUserHome() {
  // userHome：C:\Users\Administrator
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前登录用户主目录不存在！'))
  }
}

// 检查入参
function checkInputArgs() {
  const minimist = require('minimist')
  args = minimist(process.argv.slice(2))
  checkArgs()
}

function checkArgs() {
  if (args.debug) {
    // 如果存在 yzl-cli-dev --debug 那么改变日志的level
    // 让verbosek级别的可以输出日志
    process.env.LOG_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
}

// 环境变量检查
// 匹配 .env文件，方便读取里面的内容，做一些本地的缓存
// 存在的话，会被默认注入到 process.env中
function checkEnv() {
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(userHome, '.env')
  // dotenvPath :C:\Users\Administrator\.env
  if (pathExists(dotenvPath)) {
    // 默认是process.cwd()下的 .env 
    // 这里定位到用户的主目录去查找 .env文件，
    // 读取后会将所有变量放的process.env中
    // 返回值是 .env里面的配置信息
    dotenv.config({
      path: dotenvPath
    })
  }
  createDefaultConfig()
  log.verbose('环境变量', process.env.CLI_HOME_PATH)
  // yzl: verb 环环境境变变量量 C:\Users\Administrator\.yzl-cli
}

// 创建默认的配置文件
function createDefaultConfig() {
  const cliConfig = {
    home: userHome
  }
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
  }
  // 保存一个新的环境变量
  process.env.CLI_HOME_PATH = cliConfig.cliHome
}

// 检查是否需要进行全局更新
async function checkGlobalUpdate() {
  // 获取当前的版本号和模块名
  const currentVersion = pkg.version
  const npmName = pkg.name
  // 调用npm提供的API，获取所有版本号
  // 提取所有的版本号，比对哪些版本号是大于当前的
  const { getNpmSemverVersion } = require('@yzl-cli-dev/get-npm-info')
  // 获取最新的版本号，提示用户更新
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
  // 最新版本存在 同时 大于当前版本
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(colors.yellow(`请手动更新 ${npmName}，当前版本：${currentVersion}，最新版本：${lastVersion}，
                                    更新命令：npm install -g ${npmName}`))
  }
}