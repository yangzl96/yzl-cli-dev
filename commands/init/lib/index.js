'use strict';

// 项目初始化
/**
 * 
 * @param {项目名称} projectName 
 * @param {配置项} opt 
 * @param {cmd对象} cmdObj 
 */
function init(projectName, opt, cmdObj) {
  console.log(projectName, opt, process.env.CLI_TARGET_PATH)
}

module.exports = init;

