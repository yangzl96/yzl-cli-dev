'use strict';

/**
 * 支持直接使用本地已有的代码文件 和 本地缓存npm库里的文件
 */
const path = require('path')
const npminstall = require('npminstall')
const fse = require('fs-extra')
const pathExists = require('path-exists').sync
const pkgDir = require('pkg-dir').sync
const {
  isObject
} = require('@yzl-cli-dev/utils')
const log = require('@yzl-cli-dev/log')
const formatPath = require('@yzl-cli-dev/format-path')
const {
  getDefaultRegistry,
  getNpmLatestVersion
} = require('@yzl-cli-dev/get-npm-info')

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package类的options参数不能为空！')
    }
    if (!isObject(options)) {
      throw new Error('Package类的options参数必须为对象！')
    }
    console.log('--------------');
    // package路径
    this.targetPath = options.targetPath
    // 缓存package的路径
    this.storeDir = options.storeDir
    // packageName
    this.packageName = options.packageName
    // package version
    this.packageVersion = options.packageVersion
    log.verbose('packageVersion', this.packageVersion)
    // package的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
  }

  async prepare() {
    // 有路径值 但是真实文件不存在
    if (this.storeDir && !pathExists(this.storeDir)) {
      // 将this.storeDir目录 路径上的所有文件都创建出来
      log.verbose('mkdirpSync', this.storeDir)
      fse.mkdirpSync(this.storeDir)
    }
    // 如果是latest版本 那么去获取对应的版本号
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName)
    }
    log.verbose('currentVersion', this.packageVersion)
  }

  // 文件名长这样：_@yzl-cli_init@1.1.2@@yzl-cli/
  // 生成缓存的文件路径
  get cacheFilePath() {
    return path.resolve(this.storeDir,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
  }

  // 自定义版本的缓存文件路径
  getSpecificCacheFilePath(packageVersion) {
    return path.resolve(this.storeDir,
      `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`)
  }

  // 判断当前Package是否存在
  // 处于缓存的模式 还是直接使用的 targetPath
  async exists() {
    if (this.storeDir) {
      // 缓存模式
      await this.prepare()
      // 缓存路径文件是否存在
      // C:\Users\Administrator\.yzl-cli\dependencies\node_modules\_@imooc-cli_init@1.1.3@@imooc-cli\init
      // console.log(this.cacheFilePath)
      return pathExists(this.cacheFilePath)
    } else {
      // targetPath 是否存在
      return pathExists(this.targetPath)
    }
  }

  // 安装package 这里就是 init 的入口文件
  async install() {
    await this.prepare()
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
  async update() {
    await this.prepare()
    // 1.获取最新的npm模块版本
    const latestPackageVersion = await getNpmLatestVersion(this.packageName)
    log.verbose('update:latest', latestPackageVersion)
    // 2.查询最新版本号对应的缓存路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion)
    // 3.如果不存在，则直接安装最新版本
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(true),
        pkgs: [{
          name: this.packageName,
          version: latestPackageVersion
        }]
      })
      // 变更最新版本
      this.packageVersion = latestPackageVersion
      log.verbose('update:over', this.packageVersion)
    } else {
      // 变更最新版本
      this.packageVersion = latestPackageVersion
      log.verbose('update:over', this.packageVersion)
    }

  }
  // 获取入口文件的路径
  getRootFilePath() {
    function _getRootFile(targetPath) {
      // 获取package.json所在的目录 - pkg-dir
      const dir = pkgDir(targetPath)
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
    if (this.storeDir) {
      // 找缓存的
      return _getRootFile(this.cacheFilePath)
    } else {
      // 找targetPath的
      return _getRootFile(this.targetPath)
    }
  }
}

module.exports = Package;
