const {
  TYPE_PROJEC,
  TYPE_CUSTOM,
} = require('./const')

const prompt = {
  IF_CONTINUE: {
    type: 'confirm',
    name: 'ifContinue',
    default: false,
    message: '当前文件夹不为空，是否继续创建项目'
  },
  CONFIRM_DELETE: {
    type: 'confirm',
    name: 'confirmDelete',
    default: false,
    message: '是否确认清空当前目录下的文件'
  },
  PROJECT_TYPE: {
    type: 'list',
    name: 'type',
    message: '请选择初始化类型',
    default: TYPE_PROJEC,
    choices: [{
      name: '基础模板',
      value: TYPE_PROJEC
    }, {
      name: '自定义模板',
      value: TYPE_CUSTOM
    }, ]
  },
  FEATURES: {
    name: 'features',
    type: 'checkbox',
    message: '请选择:',
    choices: [{
      name: 'vuex',
    }, {
      name: 'axios'
    }],
    pageSize: 10,
    validate: function (select) {
      if (select.length < 1) {
        return '请至少选择一项'
      }
      return true
    }
  },
  PROJECT_NAME: {
    type: 'input',
    name: 'projectName',
    message: '请输入项目名称',
    default: '',
  },
  PROJECT_VERSION: {
    type: 'input',
    name: 'projectVersion',
    message: '请输入项目版本号',
    default: '1.0.0',
  },
  PROJECT_TEMPLATE: {
    type: 'list',
    name: 'projectTemplate',
    message: '请选择项目模板',
  }
}

module.exports = prompt
