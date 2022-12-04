'use strict';

const path = require('path')
const Package = require('@yzl-cli-dev/package')
const log = require('@yzl-cli-dev/log')
const {
  exec: spawn
} = require('@yzl-cli-dev/utils')
// 配置表
const SETTINGS = {
  'create-app': '@yzl-cli-dev/init'
  // 先用一个线上存的包测试
  // create: '@imooc-cli/init'
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
  log.verbose('packageName', packageName)
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
    console.log(pkg);
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
    try {
      log.verbose('rootFile', rootFile)
      // 在当前进程中调用
      // require(rootFile).call(null, Array.from(arguments))

      // 在node子进程中调用
      const args = Array.from(arguments)
      const cmd = args[args.length - 1]
      // 对cmd对象进行瘦身
      const o = Object.create(null)
      Object.keys(cmd).forEach(key => {
        if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
          o[key] = cmd[key]
        }
      })
      // 替换
      args[args.length - 1] = o
      // 注意这里传参要stringify
      const code = `require('${rootFile}').call(null,  ${JSON.stringify(args)})`
      log.verbose('执行code：' + code)
      // node -v 'code' 执行脚本
      const child = spawn('node', ['-e', code], {
        // inherit 直接监听数据打印，不需要使用 on ('data')了
        stdio: 'inherit',
        cwd: process.cwd(), //当前命令执行的位置
      })
      // 监听错误
      child.on('error', e => {
        log.error(e.message)
        process.exit(1)
      })
      // 执行成功以后的退出事件
      child.on('exit', e => {
        log.verbose('命令执行成功：' + e)
        process.exit(e)
      })
    } catch (error) {
      log.error(error.message)
    }
  }
}


module.exports = exec;
