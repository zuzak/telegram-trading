const convict = require('convict')

const isBase64 = (value) => {
  try {
    /* global aotb */
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
    enabled: {
      default: true,
      format: Boolean
    },
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
      format: ['none', 'error', 'warn', 'info', 'debug'],
      default: 'debug'
    },
    inviteLink: {
      format: String,
      default: undefined
    }
  },
  sentiment: {
    language: {
      doc: 'The language of the messages to analyse: see https://naturalnode.github.io/natural/stemmers.html',
      format: String,
      default: 'English'
    },
    vocabulary: {
      doc: 'The sentiment analysis vocabulary to use: see https://naturalnode.github.io/natural/sentiment_analysis.html',
      format: ['afinn', 'senticon', 'pattern'],
      default: 'afinn'
    }
  },
  transactions: {
    excludedSecurities: {
      doc: 'Securities to never attempt to buy',
      format: Array,
      default: [
        'NICE_US_EQ',
        'ONON_US_EQ'
      ]
    },
    reportingChannel: {
      format: Number,
      default: -1002122625485
    },
    sentimentThreshold: {
      doc: 'The strength of sentiment analysis under which to ignore messages',
      format: Number,
      default: 0.2
    },
    gbxConversion: {
      doc: 'The factor of which to multiply quantities of GBX transactions by',
      format: Number,
      default: 1
    },
    defaultExpiry: {
      doc: 'The type of expiry to set on limit orders unless otherwise specified',
      format: [
        'GTC', // Good 'Til Cancelled
        'DAY' // End of trading day
      ],
      default: 'DAY'
    },
    flipMultiplier: {
      format: Number,
      doc: 'Minimum multipler above average buy price to set sell limit orders at',
      default: 0.0025
    },
    onlySellIfProfitable: {
      format: Boolean,
      doc: 'Whether to force all sell orders to be above the average price we bought for',
      default: false
    }
  },
  webserver: {
    port: {
      format: Number,
      default: 3000
    }
  }
})

const env = config.get('env')
config.loadFile(`${env}.json`)
config.validate({ allowed: 'strict' })

module.exports = config
