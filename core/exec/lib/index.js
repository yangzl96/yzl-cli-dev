'use strict';

const Package = require('@yzl-cli-dev/package')
const log = require('@yzl-cli-dev/log')

// 配置表
const SETTINGS = {
  init: '@yzl-cli-dev/init'
}

function exec() {
  let targetPath = process.env.CLI_TARGET_PATH
  const homePath = process.env.CLI_HOME_PATH
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

  }

  const pkg = new Package({
    targetPath,
    packageName,
    packageVersion
  })
  console.log(pkg.getRootFilePath())
}


module.exports = exec;
