'use strict';

const axios = require('axios')
const urlJoin = require('url-join')
const semver = require('semver')

// 获取npm信息
function getNpmInfo(npmName, registry) {
  if (!npmName) {
    return null
  }
  const registryUrl = registry || getDefaultRegistry()
  const npmInfoUrl = urlJoin(registryUrl, npmName)
  return axios.get(npmInfoUrl).then(response => {
    if (response.status === 200) {
      return response.data
    }
    return null
  }).catch(err => {
    return Promise.reject(err)
  })
}

function getDefaultRegistry(isOriginal = false) {
  return isOriginal ? 'http://registry.npmjs.org' : 'http://registry.npm.taobao.org'
}

// 获取所有版本号
async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry)
  if (data) {
    return Object.keys(data.versions)
  } else {
    return []
  }
}

// 获取满足条件的版本号
function getNpmSemverVersions(baseVersion, versions) {
  // 遍历所有的版本号，取出 大于等于 baseVersion的版本号
  // 同时做一个从大到小的排序，避免万一返回的version顺序不正确
  return versions.filter(version => semver.satisfies(version, `^${baseVersion}`)).sort((a, b) => {
    // b 大于 a 那么 b排在前面
    return semver.gt(b, a)
  })
}
// 获取当前的最高版本
async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry)
  const newVersions = getNpmSemverVersions(baseVersion, versions)
  if (newVersions && newVersions.length > 0) {
    return newVersions[0]
  }
  return null
}

module.exports = {
  getNpmSemverVersion,
  getDefaultRegistry
};

