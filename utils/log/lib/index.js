'use strict';
const log = require('npmlog')
// 日志的输出跟 level 有关,比如默认的是 info
// 它对应的level是 2000 ，意味着只有调用大于2000的level 日志才会打印
// level低于他的，就算调用了，也不会打印

// 判断debugger模式
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'
// 日志前缀设置
log.heading = 'yzl:'
// 新增自定义类别
log.addLevel('success', 2000, { fg: 'green', bold: true })

module.exports = log;
