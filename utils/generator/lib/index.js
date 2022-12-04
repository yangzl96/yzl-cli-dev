'use strict';
const fse = require('fs-extra')
const path = require('path')
const {
  isFunction,
  isObject
} = require('@yzl-cli-dev/utils')

class Generator {
  constructor({
    pkg = {},
  }) {
    // this.originalPkg = pkg
    this.pkg = Object.assign({}, pkg)
    this.targetPath = path.resolve(process.cwd(), 'src')
  }

  // 拓展 package.json
  extendPackage(fields, options = {}) {
    let pkg = this.pkg
    const toMerge = isFunction(fields) ? fields(pkg) : fields
    pkg = this.deepMerge(pkg, toMerge)
    fse.writeFileSync(path.resolve(process.cwd(), 'package.json'), JSON.stringify(pkg, null, '\t'))
  }
  // 合并配置
  deepMerge(target = {}, value) {
    Object.keys(value).forEach(key => {
      const newV = value[key]
      const oldV = target[key]
      if (isObject(oldV) && isObject(newV)) {
        target[key] = this.deepMerge(oldV, newV)
      } else {
        target[key] = newV
      }
    })
    return target
  }
  // 渲染模板
  render(templatePath) {
    console.log('render templatePath:', templatePath);
    console.log('render targetPath:', this.targetPath);
    try {
      fse.ensureDirSync(templatePath)
      fse.ensureDirSync(this.targetPath)
      // 拷贝
      fse.copySync(templatePath, this.targetPath)
    } catch (error) {
      console.log(error);
    }
  }
}


module.exports = Generator;
