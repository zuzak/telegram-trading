const { TelegramClient } = require('telegram')
const { StringSession } = require('telegram/sessions')

const config = require('./config.js')

const client = new TelegramClient(
  new StringSession(config.get('telegram.stringSession')),
  config.get('telegram.apiId'),
  config.get('telegram.apiHash')
)

client.setLogLevel(config.get('telegram.logLevel'))

module.exports = async () => {
  await client.start({ botAuthToken: config.get('telegram.botToken') })
  console.log('a')
  if (!config.get('telegram.stringSession')) {
    config.set('telegram.stringSession', client.session.save())
    console.log('Set telegram.stringSession in the config to speed up logins:')
    console.log(`    ${config.get('telegram.stringSession')}`)
  }

  setInterval(async () => {
    if (!client.connected) await client.connect()
    if (client.checkAuthorization()) await client.getMe()
  }, config.get('telegram.heartbeatInterval'))

  return client
}
