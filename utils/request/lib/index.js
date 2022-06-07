'use strict';

const axios = require('axios')

const BASE_URL = process.env.YZL_CLI_BASE_URL ? process.env.YZL_CLI_BASE_URL :
  'http://yzl.dev.com:7001'

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 5000
})

request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    return Promise.reject(error)
  }
)


module.exports = request;

