const request = require('@yzl-cli-dev/request')

module.exports = function () {
  return request({
    url: '/project/template'
  })
}