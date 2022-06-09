'use strict';


function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}

function spinnerStart(msg = 'processing.. ', spinnerString = '|/-\\') {
  const Spinner = require('cli-spinner').Spinner;
  const spinner = new Spinner(msg + ' %s');
  spinner.setSpinnerString(spinnerString);
  spinner.start();
  return spinner
}

function sleep(timeout = 1000) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

// 执行命令 兼容写法
// window上：cp.spawn('cmd', ['/c', 'node', '-e'], code)
function exec(command, args, options) {
  const win32 = process.platform === 'win32'
  const cmd = win32 ? 'cmd' : command
  // windows多 c盘路径
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args
  return require('child_process').spawn(cmd, cmdArgs, options || {})
}

// 异步执行
function execAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = exec(command, args, options)
    // 异常
    p.on('error', e => {
      reject(e)
    })
    // 执行完成
    p.on('exit', c => {
      resolve(c)
    })
  })
}


module.exports = {
  isObject,
  spinnerStart,
  sleep,
  exec,
  execAsync
}