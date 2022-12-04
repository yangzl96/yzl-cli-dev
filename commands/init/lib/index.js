'use strict';

// 项目初始化

const Command = require('@yzl-cli-dev/command')
const Package = require('@yzl-cli-dev/package')
const {
  spinnerStart,
  sleep,
  execAsync,
  exec: spawn
} = require('@yzl-cli-dev/utils')
const log = require('@yzl-cli-dev/log')
const Generator = require('@yzl-cli-dev/generator')
const path = require('path')
const userHome = require('user-home')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const ejs = require('ejs')
const glob = require('glob')
const semver = require('semver')
const getProjectTemplate = require('./getProjectTemplate')
const prompt = require('./prompt')
const {
  TYPE_PROJEC,
  TYPE_CUSTOM,
  WHITE_COMMAND,
} = require('./const')


class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._argv[1].force
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }

  async exec() {
    try {
      // 准备阶段
      const projectInfo = await this.prepare()
      if (projectInfo) {
        log.verbose('projectInfo', projectInfo)
        this.projectInfo = projectInfo
        // 下载模板
        await this.downloadTemplate()
        //  安装模板
        await this.installTemplate()
      }
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
        ifContinue = (await inquirer.prompt(prompt.IF_CONTINUE)).ifContinue
        if (!ifContinue) {
          return
        }
      }
      if (ifContinue || this.force) {
        // 2. 是否启动强制更新
        // 做二次确认
        const {
          confirmDelete
        } = await inquirer.prompt(prompt.CONFIRM_DELETE)
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
    let projectBaseInfo = {}
    let projectInfo = {}
    let projectTypeInfo = {}
    const projectPrompt = []
    let isProjectNameValid = false
    // 如果初始化输入了项目名并且合法
    if (isValidName(this.projectName)) {
      isProjectNameValid = true
      projectInfo.projectName = this.projectName
    }

    // 基础信息获取
    // 项目名称
    const projectNamePrompt = {
      ...prompt.PROJECT_NAME,
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
    // 名称不合法或者没输入就注入询问的命令
    if (!isProjectNameValid) {
      projectPrompt.push(projectNamePrompt)
    }
    // 询问版本
    projectPrompt.push({
      ...prompt.PROJECT_VERSION,
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
    })
    // 定义基础询问
    projectBaseInfo = await inquirer.prompt(projectPrompt)

    // 初始化类型获取
    const {
      type
    } = await inquirer.prompt(prompt.PROJECT_TYPE)
    // 根据type过滤模板显示
    this.template = this.template.filter(template => template.tag.includes(type))

    if (type === TYPE_PROJEC) {
      projectTypeInfo = await inquirer.prompt({
        ...prompt.PROJECT_TEMPLATE,
        choices: this.createTemplateChoices()
      })
    } else if (type === TYPE_CUSTOM) {
      projectTypeInfo = await inquirer.prompt(prompt.FEATURES)
      projectTypeInfo.projectTemplate = 'yzl-cli-dev-template-vue3'
    }

    projectInfo = {
      type,
      ...projectInfo,
      ...projectBaseInfo,
      ...projectTypeInfo
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
    //pluginss
    if (projectInfo.features) {
      projectInfo.plugins = projectInfo.features
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
    const {
      projectTemplate
    } = this.projectInfo
    const templateInfo = this.template.find(item => item.npmName === projectTemplate)
    const targetPath = path.resolve(userHome, '.yzl-cli-dev', 'template')
    const storeDir = path.resolve(userHome, '.yzl-cli-dev', 'template', 'node_modules')
    const {
      npmName,
      version
    } = templateInfo
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
        this.templateInfo.type = TYPE_PROJEC
      }
      if (this.templateInfo.type === TYPE_PROJEC) {
        // 标准安装
        await this.installNormalTemplate()
      } else if (this.templateInfo.type === TYPE_CUSTOM) {
        await this.installCustomTemplate()
      } else {
        throw Error('项目模板类型无法识别！')
      }
    } else {
      throw Error('项目模板不存在！')
    }
  }

  // 拷贝模板代码至当前目录
  async copyFileToCurrentDir() {
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
  }

  // 自定义安装
  async installCustomTemplate() {
    // 拷贝模板
    await this.copyFileToCurrentDir()
    log.verbose('pkgPath:', path.join(process.cwd(), 'package.json'))
    const pkg = fse.readFileSync(path.join(process.cwd(), 'package.json'), {
      encoding: 'utf-8'
    })
    // 实例化生成工具
    const generator = new Generator({
      pkg: JSON.parse(pkg)
    })
    // 注册自定义插件
    const {
      features
    } = this.projectInfo;
    features.forEach(pluginName => {
      this.loadModule(pluginName, generator)
    })

    // this.handleEjsRenderInit()
    // this.handleInstallAndRun()
  }

  async loadModule(name, ctx) {
    // const pluginPath = path.resolve(__dirname, `../../../plugins/${name}`)
    const pluginName = `@yzl-cli-dev/${name}`
    // log.verbose('pluginPath:', pluginPath)
    // const plugin = require(pluginPath)
    // const targetPath = path.resolve(userHome, '.yzl-cli-dev', 'plugins')
    const storeDir = path.resolve(userHome, '.yzl-cli-dev', 'plugins', 'node_modules')
    const pluginPackage = new Package({
      targetPath: process.cwd(),
      storeDir,
      packageName: pluginName,
      packageVersion: 'latest'
    })
    await pluginPackage.install()
    const rootFile = pluginPackage.getRootFilePath()
    log.verbose('rootFile', rootFile)
    const plugin = require(rootFile)
    new plugin(ctx)
    return
    if (rootFile) {
      try {
        log.verbose('rootFile', rootFile)
        const code = `new (require('${rootFile}'))(${JSON.stringify(ctx)})`
        log.verbose('执行code：' + code)
        // node -v 'code' 执行脚本
        const child = spawn('node', ['-e', code], {
          stdio: 'inherit',
          cwd: process.cwd(),
        })
        child.on('error', e => {
          log.error(e.message)
          process.exit(1)
        })
        child.on('exit', e => {
          log.verbose('命令执行成功：' + e)
          process.exit(e)
        })
      } catch (error) {
        log.error(error.message)
      }
    }
    // const plugin = require(pluginName)
    // new plugin(ctx)
  }

  // 标准安装
  async installNormalTemplate() {
    await this.copyFileToCurrentDir()
    // this.handleEjsRenderInit()
    // this.handleInstallAndRun()
  }
  // ejs渲染准备
  async handleEjsRenderInit() {
    // 要忽略的文件
    const templateIgnore = this.templateInfo.ignore || []
    const ignore = ['**/node_modules/**', ...templateIgnore]
    // ejs渲染
    await this.ejsRender({
      ignore
    })
  }

  async handleInstallAndRun() {
    // 依赖安装
    const {
      installCommand,
      startCommand
    } = this.templateInfo
    await this.execCommand(installCommand, '依赖安装过程中失败！')
    // 启动执行命令
    await this.execCommand(startCommand, '启动过程中失败！')
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

  // ejs渲染
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
        console.log(files);
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
