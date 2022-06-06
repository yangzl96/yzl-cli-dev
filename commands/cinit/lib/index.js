'use strict';

// 项目初始化

const Command = require('@yzl-cli-dev/command')
const log = require('@yzl-cli-dev/log')
const inquirer = require('inquirer')
const fse = require('fs-extra')

const TYPE_PROJEC = 'project'
const TYPE_COMPONENT = 'component'

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._argv[1].force
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }

  async exec() {
    try {
      // 1. 准备阶段
      await this.prepare()
      // 2. 下载模板
      // 3. 安装模板
    } catch (error) {
      log.error(error.message)
    }
  }

  async prepare() {
    const localPath = process.cwd()
    log.verbose('localPath', localPath)
    // 1. 判断当前目录是否为空
    if (!this.isDirEmpty(localPath)) {
      let ifContinue = false
      // 如果没有 force
      if (!this.force) {
        //  1.1 询问是否继续创建
        ifContinue = (await inquirer.prompt({
          type: 'confirm',
          name: 'ifContinue',
          default: false,
          message: '当前文件夹不为空，是否继续创建项目'
        })).ifContinue
        if (!ifContinue) {
          return
        }
      }
      if (ifContinue || this.force) {
        // 2. 是否启动强制更新
        // 做二次确认
        const { confirmDelete } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          default: false,
          message: '是否确认清空当前目录下的文件'
        })
        if (confirmDelete) {
          // 清空当前目录内的文件
          fse.emptyDirSync(localPath)
        }
      }
    }
    return this.getPorjectInfo()
  }

  async getPorjectInfo() {
    // 1. 选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: TYPE_PROJEC,
      choices: [
        {
          name: '项目',
          value: TYPE_PROJEC
        },
        {
          name: '组件',
          value: TYPE_COMPONENT
        }
      ]
    })
    log.verbose('type', type)
    // 2. 获取项目基本信息
  }

  isDirEmpty(localPath) {
    let fileList = fs.readdirSync(localPath)
    // 文件过滤(缓存文件认为是空)
    fileList = fileList.filter(file => (
      !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
    ))
    return !fileList && fileList.length <= 0
  }

}

/**
 * 
 * @param {项目名称} argv[0]
 * @param {配置项} argv[1] 
 * @param {cmd对象} argv[2] 
 */
function init(argv) {
  // projectName, opt, cmdObj
  // console.log(projectName, opt, process.env.CLI_TARGET_PATH)
  new InitCommand(argv)
}


module.exports = init
module.exports.InitCommand = InitCommand