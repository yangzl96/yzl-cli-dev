import axios from 'axios'
import {
  message
} from 'ant-design-vue'
<% if (plugins.includes('vuex')) { %>
  import store from '@/store'
<% } %>
import {
  getToken
} from '@/utils/auth'

const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  timeout: 5000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {

    <% if (plugins.includes('vuex')) { %>
    if (store.getters.token) {
      config.headers['X-Token'] = getToken()
    }
    <% } %>
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  response => {
    const res = response.data

    if (res.code !== 20000) {
      message.error(
        res.message || 'Error',
        5 * 1000,
      )
      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      return res
    }
  },
  error => {
    console.log('err' + error)
    message.error(
      error.message || 'Error',
      5 * 1000,
    )
    return Promise.reject(error)
  }
)

export default service
