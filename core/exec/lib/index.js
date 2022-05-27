'use strict';

const path = require('path')
const Package = require('@yzl-cli-dev/package')
const log = require('@yzl-cli-dev/log')

// 配置表
const SETTINGS = {
  // init: '@yzl-cli-dev/init'
  init: '@imooc-cli/init'
}

const CACHE_DIR = 'dependencies/'

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH
  const homePath = process.env.CLI_HOME_PATH
  let storeDir = ''
  let pkg
  log.verbose('targetPath', targetPath)
  log.verbose('homePath', homePath)

  const cmdObj = arguments[arguments.length - 1]
  // cmdObj.opts() 拿到选项
  // cmdObj.name() 拿到command名称
  const cmdName = cmdObj.name()
  const packageName = SETTINGS[cmdName]
  const packageVersion = 'latest'

  if (!targetPath) {
    // 生成缓存路径
    targetPath = path.resolve(homePath, CACHE_DIR)
    storeDir = path.resolve(targetPath, 'node_modules')
    log.verbose('targetPath', targetPath)
    log.verbose('storeDir', storeDir)
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion
    })
    if (pkg.exists()) {
      // 存在的时候 更新 package

    } else {
      // 不存在 安装package
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion
    })
  }
  const rootFile = pkg.getRootFilePath()
  if (rootFile) {
    console.log(rootFile)
    require(rootFile).apply(null, arguments)
  }
}


module.exports = exec;
