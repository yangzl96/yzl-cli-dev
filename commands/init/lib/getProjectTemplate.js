// const request = require('@yzl-cli-dev/request')

// module.exports = function () {
//   return request({
//     url: '/project/template'
//   })
// }

module.exports = function () {
  return [{
      "_id": "629dc6aadacf299a5735d06c",
      "name": "vue3标准模板",
      "npmName": "yzl-cli-dev-template-vue3",
      "version": "1.0.0",
      "type": "normal_project",
      "installCommand": "cnpm install",
      "startCommand": "npm run serve",
      "ignore": [
        "**/public/**"
      ],
      "tag": [
        "normal_project"
      ]
    },
    {
      "_id": "639dc6aadacf299a5735d08r",
      "name": "vue3自定义",
      "npmName": "yzl-cli-dev-template-vue3",
      "version": "1.0.0",
      "type": "custom_project",
      "installCommand": "cnpm install",
      "startCommand": "npm run serve",
      "ignore": [
        "**/public/**"
      ],
      "tag": [
        "custom_project"
      ]
    },
    {
      "_id": "629efbd95cbfca68a1ec3c96",
      "name": "vue-admin-template模板",
      "type": "normal_project",
      "npmName": "yzl-cli-dev-template-vue-element-admin",
      "version": "1.0.0",
      "installCommand": "cnpm install",
      "startCommand": "npm run dev",
      "ignore": [
        "**/public/**",
        "**/assets/**"
      ],
      "tag": [
        "normal_project"
      ]
    }
  ]
}
