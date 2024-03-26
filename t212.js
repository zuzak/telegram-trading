const axios = require('axios')
const config = require('./config.js')

module.exports = axios.create({
  baseURL: `https://${config.get('trading212.env')}.trading212.com/api/v0/`,
  responseType: 'json',
  headers: {
    authorization: config.get('trading212.apiKey')
  }
})
