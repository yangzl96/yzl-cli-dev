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
const ejs = require('ejs')
const glob = require('glob')
const semver = require('semver')
const getProjectTemplate = require('./getProjectTemplate')

// 新建类型
const TYPE_PROJEC = 'project'
const TYPE_COMPONENT = 'component'

// 模板类型
const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_CUSTOM = 'custom'

// 指令白名单
const WHITE_COMMAND = ['npm', 'cnpm']


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
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log(error)
      }
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
    log.verbose('当前路径：', localPath)
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
    // 首字符必须为英文
    // 尾字符必须为英文或数字，不能为字符
    // 字符仅支持 - _
    // 合法的：a , a-b, a_b, a-b-c, a-b1-c1, a_b1_c1
    // 非法的：1, a_, a-, a-1, a_1
    function isValidName(v) {
      return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)
    }

    let projectInfo = {}
    let isProjectNameValid = false
    // 如果初始化输入了项目名并且合法
    if (isValidName(this.projectName)) {
      isProjectNameValid = true
      projectInfo.projectName = this.projectName
    }
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
    // 根据type过滤模板显示
    this.template = this.template.filter(template => template.tag.includes(type))
    if (type === TYPE_PROJEC) {
      // 2. 获取项目基本信息
      const projectNamePrompt = {
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称',
        default: '',
        validate: function (v) {
          const done = this.async()
          setTimeout(() => {
            if (!isValidName(v)) {
              done('请输入合法的项目名称!(首字符英文，结尾不能为字符，字符仅支持_-)')
              return
            }
            done(null, true)
          }, 0)
        },
        filter: function (v) {
          return v
        }
      }
      const projectPrompt = []
      // 名称不合法或者没输入就注入询问的命令
      if (!isProjectNameValid) {
        projectPrompt.push(projectNamePrompt)
      }
      // 默认需要的询问
      projectPrompt.push({
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
      })
      // 定义命令行询问
      const project = await inquirer.prompt(projectPrompt)
      projectInfo = {
        type,
        ...projectInfo,
        ...project,
      }
    } else if (type === TYPE_COMPONENT) {

    }
    // 生成classname
    if (projectInfo.projectName) {
      projectInfo.name = projectInfo.projectName
      projectInfo.className = require('kebab-case')(projectInfo.projectName).replace(/^-/, '')
    }
    // version
    if (projectInfo.projectVersion) {
      projectInfo.version = projectInfo.projectVersion
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
    log.verbose('templateInfo', templateInfo)
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
    log.verbose('templateNpm', this.templateNpm)
    let spinner = spinnerStart('正在安装模板...')
    await sleep()
    try {
      const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template')
      const targetPath = process.cwd()
      fse.ensureDirSync(templatePath)
      fse.ensureDirSync(targetPath)
      // 拷贝
      fse.copySync(templatePath, targetPath)
    } catch (error) {
      throw error
    } finally {
      spinner.stop(true)
      log.success('模板安装成功')
    }
    // 要忽略的文件
    const templateIgnore = this.templateInfo.ignore || []
    const ignore = ['**/node_modules/**', ...templateIgnore]
    // ejs渲染
    await this.ejsRender({ ignore })
    // 依赖安装
    const { installCommand, startCommand } = this.templateInfo
    await this.execCommand(installCommand, '依赖安装过程中失败！')
    // 启动执行命令
    await this.execCommand(startCommand, '启动过程中失败！')
  }

  async installCustomTemplate() {
    console.log(2)
  }

  async execCommand(command, errMsg) {
    let ret // 0 表示成功
    if (command) {
      const cmdArray = command.split(' ')
      const cmd = this.checkCommand(cmdArray[0])
      if (!cmd) {
        throw new Error('命令不存在!命令：', command)
      }
      const args = cmdArray.slice(1)
      ret = await execAsync(cmd, args, {
        // 就是这个过程是在子进程进行的
        // 但是inherit可以将当前结果直接转向当前主进程的输入输出流
        // 也就是打印
        stdio: 'inherit',
        cwd: process.cwd()
      })
    }
    if (ret !== 0) {
      throw new Error(errMsg)
    }
    return ret
  }

  // 模板选择
  createTemplateChoices() {
    return this.template.map(item => ({
      value: item.npmName,
      name: item.name
    }))
  }

  // 白名单指令检测
  checkCommand(cmd) {
    if (WHITE_COMMAND.includes(cmd)) {
      return cmd
    }
    return null
  }

  async ejsRender(options) {
    const dir = process.cwd()
    const projectInfo = this.projectInfo
    return new Promise((resolve, reject) => {
      // 获取所有的文件
      glob('**', {
        cwd: dir,
        ignore: options.ignore,
        nodir: true
      }, (err, files) => {
        if (err) {
          reject(err)
        }
        Promise.all(files.map(file => {
          // 对文件进行render
          const filePath = path.join(dir, file)
          return new Promise((resolve1, reject1) => {
            ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
              if (err) {
                // BASE_URL is not defined 
                // 这是脚手架public里面的，是webpack中用的
                console.log(err)
                reject1(err)
              } else {
                // 写入
                fse.writeFileSync(filePath, result)
                resolve1(result)
              }
            })
          });
        })).then(res => {
          resolve()
        }).catch(err => {
          reject(err)
        })
      })
    })
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