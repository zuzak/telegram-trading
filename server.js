const { Api } = require('telegram')
const formatters = require('./formatters.js')
const config = require('./config.js')

const commands = require('./commands.js')
const transactions = require('./transactions.js')

const webserver = require('./webserver.js')

const main = async () => {
  const client = await require('./client.js')()

  commands(client)
  transactions(client)

  const updateCash = async () => {
    const cash = formatters.generateCashSummary('strapline')
    try {
      await client.invoke(
        new Api.channels.EditTitle({
          channel: config.get('transactions.reportingChannel'),
          title: (await cash)
        })
      )
    } catch (e) {
      if (e.errorMessage === 'CHAT_NOT_MODIFIED') return
      throw e
    } finally {
      setTimeout(updateCash, 1000 * 60 * 5)
    }
  }
  updateCash()

  webserver.listen(config.get('webserver.port'))
}

main()
