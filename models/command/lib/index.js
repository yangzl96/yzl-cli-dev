'use strict';

const semver = require('semver')
const colors = require('colors')
const log = require('@yzl-cli-dev/log');


const LOWEST_NODE_VERSION = '12.0.0'


class Command {
  constructor(argv) {
    // log.verbose('Command constructor', argv)
    if (!argv) {
      throw new Error('参数不能为空')
    }
    if (!Array.isArray(argv)) {
      throw new Error('参数必须为数组')
    }
    if (argv.length < 1) {
      throw new Error('参数列表不为空')
    }

    this._argv = argv
    let runner = new Promise((resolve, reject) => {
      // console.log(this) 这里的this 是  initCommand 因为是他自己调用的
      // 所以下面的方法优先去initCommand里面找，没有才会找父级
      let chain = Promise.resolve()
      chain = chain.then(() => this.checkNodeVersion())
      chain = chain.then(() => this.initArgs())
      chain = chain.then(() => this.init())
      chain = chain.then(() => this.exec())
      chain.catch(err => {
        log.error(err.message)
      })
    })
  }

  init() {
    // 如果 initCommand没有init 就会走这
    throw new Error('init必须实现')
  }

  exec() {
    // 如果 initCommand没有exec 就会走这
    throw new Error('exec必须实现')
  }

  // 检查Node版本
  checkNodeVersion() {
    // 当前版本号
    const currentVersion = process.version
    const lowestVersion = LOWEST_NODE_VERSION
    // 比对最低版本号
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(colors.red(`yzl-cli 需要安装 v${lowestVersion} 以上版本的 Node.js`))
    }
  }

  // 初始化参数
  initArgs() {
    this._cmd = this._argv[this._argv.length - 1]
    this._argv = this._argv.slice(0, this._argv.length - 1)
  }
}

module.exports = Command;

