const convict = require('convict')

const isBase64 = (value) => {
  try {
    aotb(value)
    return true
  } catch (e) {
    return false
  }
}

const config = convict({
  env: {
    doc: 'The application environment',
    default: 'development',
    env: 'NODE_ENV'
  },
  trading212: {
    env: {
      doc: 'The Trading212 endpoint to use',
      format: ['demo', 'live'],
      default: 'demo'
    },
    apiKey: {
      doc: 'The Trading212 API key to use',
      default: undefined,
      format: isBase64
    }
  },
  telegram: {
    apiId: {
      doc: 'Telegram API creds -- get this from my.telegram.org',
      format: Number,
      default: undefined
    },
    apiHash: {
      doc: 'Telegram API creds -- get this from my.telegram.org',
      format: String,
      default: undefined
    },
    botToken: {
      doc: 'Telegram bot token -- get this from t.me/BotFather',
      format: String,
      default: undefined
    },
    heartbeatInterval: {
      doc: 'Number of milliseconds to re-connect to Telegram',
      format: Number,
      default: 30000
    },
    stringSession: {
      doc: 'The session token used to log in the second time onwards',
      format: isBase64,
      default: ''
    },
    logLevel: {
      doc: 'The log level of the internal Telegram library',
      format: [ 'none', 'error', 'warn', 'info', 'debug' ],
      default: 'debug'
    }
  }
})

const env = config.get('env')
config.loadFile(`${env}.json`)
config.validate({allowed: 'strict'})

module.exports = config
