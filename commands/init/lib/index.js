'use strict';

// 项目初始化

const Command = require('@yzl-cli-dev/command')
const Package = require('@yzl-cli-dev/package')
const { spinnerStart, sleep, execAsync } = require('@yzl-cli-dev/utils')
const log = require('@yzl-cli-dev/log')
const path = require('path')
const userHome = require('user-home')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const semver = require('semver')
const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJEC = 'project'
const TYPE_COMPONENT = 'component'
const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_CUSTOM = 'custom'

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
      const projectInfo = await this.prepare()
      if (projectInfo) {
        // 2. 下载模板
        log.verbose('projectInfo', projectInfo)
        this.projectInfo = projectInfo
        await this.downloadTemplate()
        // 3.  安装模板
        await this.installTemplate()
      }
      // 3. 安装模板
    } catch (error) {
      log.error(error.message)
    }
  }

  // 准备工作
  async prepare() {
    // 0. 判断项目模板是否存在
    const template = await getProjectTemplate()
    if (!template || template.length === 0) {
      throw new Error('项目模板不存在！')
    }
    this.template = template
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

  // 获取项目信息
  async getPorjectInfo() {
    let projectInfo = {}
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
    if (type === TYPE_PROJEC) {
      // 2. 获取项目基本信息
      const project = await inquirer.prompt([{
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称',
        default: '',
        validate: function (v) {
          // 首字符必须为英文
          // 尾字符必须为英文或数字，不能为字符
          // 字符仅支持 - _
          // 合法的：a , a-b, a_b, a-b-c, a-b1-c1, a_b1_c1
          // 非法的：1, a_, a-, a-1, a_1
          const done = this.async()
          setTimeout(() => {
            if (! /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
              done('请输入合法的项目名称!(首字符英文，结尾不能为字符，字符仅支持_-)')
              return
            }
            done(null, true)
          }, 0)
        },
        filter: function (v) {
          return v
        }
      }, {
        type: 'input',
        name: 'projectVersion',
        message: '请输入项目版本号',
        default: '1.0.0',
        validate: function (v) {
          const done = this.async()
          setTimeout(() => {
            if (!(!!semver.valid(v))) {
              done('请输入合法的版本号')
              return
            }
            done(null, true)
          }, 0)
        },
        filter: function (v) {
          // semver.valid 帮助处理版本号
          // v1.0.0 => 1.0.0
          if (semver.valid(v)) {
            return semver.valid(v)
          } else {
            return v
          }
        }
      }, {
        type: 'list',
        name: 'projectTemplate',
        message: '请选择项目模板',
        choices: this.createTemplateChoices()
      }])
      projectInfo = {
        type,
        ...project
      }
    } else if (type === TYPE_COMPONENT) {

    }
    return projectInfo
  }

  // 是否是空文件夹
  isDirEmpty(localPath) {
    let fileList = fs.readdirSync(localPath)
    // 文件过滤(缓存文件认为是空)
    fileList = fileList.filter(file => (
      !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
    ))
    return !fileList || fileList.length <= 0
  }

  // 下载模板
  async downloadTemplate() {
    // 模板制定工作
    // 1. 通过项目模板API获取项目模板信息
    // 1.1 通过egg搭建一套后端系统
    // 1.2 通过Npm存储项目模板(vue-cli / vue-element-admin)
    // 1.3 将项目模板信息存储到mongodb数据库中
    // 1.4 通过egg获取mongodb中的数据并且通过API返回

    // 下载工作
    const { projectTemplate } = this.projectInfo
    const templateInfo = this.template.find(item => item.npmName === projectTemplate)
    const targetPath = path.resolve(userHome, '.yzl-cli-dev', 'template')
    const storeDir = path.resolve(userHome, '.yzl-cli-dev', 'template', 'node_modules')
    const { npmName, version } = templateInfo
    // 保存当前选中的模板
    this.templateInfo = templateInfo
    const templateNpm = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version
    })
    if (!await templateNpm.exists()) {
      const spinner = spinnerStart('正在下载模板...')
      await sleep()
      try {
        await templateNpm.install()
      } catch (error) {
        throw error
      } finally {
        spinner.stop(true)
        if (await templateNpm.exists()) {
          log.success('下载模板成功')
          // 保存package实例
          this.templateNpm = templateNpm
        }
      }
    } else {
      const spinner = spinnerStart('正在更新模板...')
      await sleep()
      try {
        await templateNpm.update()
      } catch (error) {
        throw error
      } finally {
        spinner.stop(true)
        if (await templateNpm.exists()) {
          log.success('更新模板成功')
          // 保存package实例
          this.templateNpm = templateNpm
        }
      }
    }
  }

  // 安装模板
  async installTemplate() {
    if (this.templateInfo) {
      if (!this.templateInfo.type) {
        this.templateInfo.type = TEMPLATE_TYPE_NORMAL
      }
      if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
        // 标准安装
        await this.installNormalTemplate()
      } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
        //自定义安装
        await this.installCustomTemplate()
      } else {
        throw Error('项目模板类型无法识别！')
      }
    } else {
      throw Error('项目模板不存在！')
    }
  }

  async installNormalTemplate() {
    // 拷贝模板代码至当前目录
    let spinner = spinnerStart('正在安装模板...')
    await sleep()
    try {
      const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template')
      const targetPath = process.cwd()
      fse.ensureDirSync(templatePath)
      fse.ensureDirSync(targetPath)
      fse.copySync(templatePath, targetPath)
    } catch (error) {
      throw error
    } finally {
      spinner.stop(true)
      log.success('模板安装成功')
    }
    // 依赖安装
    const { installCommand, startCommand } = this.templateInfo
    let installRes // 0 表示成功
    if (installCommand) {
      const installCmd = installCommand.split(' ')
      const cmd = installCmd[0]
      const args = installCmd.slice(1)
      installRes = await execAsync(cmd, args, {
        // 就是这个过程是在子进程进行的
        // 但是inherit可以将当前结果直接转向当前主进程的输入输出流
        // 也就是打印
        stdio: 'inherit',
        cwd: process.cwd()
      })
      if (installRes !== 0) {
        throw new Error('依赖安装失败')
      }
    }
    // 启动执行命令
    if (startCommand) {
      const startCmd = startCommand.split(' ')
      const cmd = startCmd[0]
      const args = startCmd.slice(1)
      installRes = await execAsync(cmd, args, {
        stdio: 'inherit',
        cwd: process.cwd()
      })
    }
  }

  async installCustomTemplate() {
    console.log(2)
  }

  // 模板选择
  createTemplateChoices() {
    return this.template.map(item => ({
      value: item.npmName,
      name: item.name
    }))
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