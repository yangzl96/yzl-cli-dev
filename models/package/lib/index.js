'use strict';

const path = require('path')
const npminstall = require('npminstall')
const pkgDir = require('pkg-dir').sync
const { isObject } = require('@yzl-cli-dev/utils')
const formatPath = require('@yzl-cli-dev/format-path')
const { getDefaultRegistry } = require('@yzl-cli-dev/get-npm-info')

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package类的options参数不能为空！')
    }
    if (!isObject(options)) {
      throw new Error('Package类的options参数必须为对象！')
    }
    // package路径
    this.targetPath = options.targetPath
    // 缓存package的路径
    this.storeDir = options.storeDir
    // packageName
    this.packageName = options.packageName
    // package version
    this.packageVersion = options.packageVersion
  }

  // 判断当前Package是否存在
  exists() {

  }

  // 安装package 这里就是 init 的入口文件
  install() {
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(true),
      pkgs: [{
        name: this.packageName,
        version: this.packageVersion
      }]
    })
  }

  // 更新package
  update() {

  }
  // 获取入口文件的路径
  getRootFilePath() {
    // 获取package.json所在的目录 - pkg-dir
    const dir = pkgDir(this.targetPath)
    if (dir) {
      // 读取package.json - require()
      const pkgFile = require(path.resolve(dir, 'package.json'))
      // 寻找main / lib - path
      if (pkgFile && pkgFile.main) {
        // 路径的兼容win / mac
        return formatPath(path.resolve(dir, pkgFile.main))
      }
    }
    return null
  }
}

module.exports = Package;
