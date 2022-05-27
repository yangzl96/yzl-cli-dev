'use strict';

const path = require('path')
const pkgDir = require('pkg-dir').sync
const { isObject } = require('@yzl-cli-dev/utils')
const formatPath = require('@yzl-cli-dev/format-path')

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
    // packageName
    this.packageName = options.packageName
    // package version
    this.packageVersion = options.packageVersion
  }

  // 判断当前Package是否存在
  exists() {

  }

  // 安装package
  install() {

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
