'use strict';

const path = require('path')
const Package = require('@yzl-cli-dev/package')
const log = require('@yzl-cli-dev/log')

// 配置表
const SETTINGS = {
  // init: '@yzl-cli-dev/init'
  // 先用一个线上存的包测试
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

  // 没指定init目标路径
  if (!targetPath) {
    // 生成缓存路径
    targetPath = path.resolve(homePath, CACHE_DIR)
    storeDir = path.resolve(targetPath, 'node_modules')
    log.verbose('targetPath', targetPath)
    log.verbose('storeDir', storeDir)
    // 多传一个缓存路径 storeDir
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion
    })
    if (await pkg.exists()) {
      // 存在的时候 更新 package
      log.verbose('更新 package')
      await pkg.update()
    } else {
      // targetPath 没有 缓存也没有
      // 不存在 安装package
      // 这里要await 否则程序走到下面找不到文件就会报错了
      log.verbose('package不存在')
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
  // 加载init方法
  if (rootFile) {
    log.verbose('rootFile', rootFile)
    // 使用apply后，初始化的方法才可以正常接收参数
    // apply的数组用方法接收时会变成单个单个的参数
    require(rootFile).apply(null, arguments)
  }
}


module.exports = exec;
