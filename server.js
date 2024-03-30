const { NewMessage } = require('telegram/events')
const { Api } = require('telegram')
const instruments = require('./instruments.js')
const sentiment = require('./sentiment.js')
const orders = require('./orders.js')
const formatters = require('./formatters.js')
const config = require('./config.js')

const main = async () => {
  const client = await require('./client.js')()

  client.addEventHandler(async (event) => {
    client.invoke(
      new Api.messages.SetTyping({
        peer: config.get('transactions.reportingChannel'),
        action: new Api.SendMessageTypingAction({})
      })
    )
    const msg = event.message
    const sender = await msg.getSender()

    const possibleInstruments = instruments.searchStringForInstruments(msg.message)
    const senti = sentiment.getSentiment(msg.message)
    console.log(
      new Date(msg.date * 1000),
      formatters.formatUsername(sender),
      msg.message,
      senti
    )

    const transactingInstrument = orders.selectInstrument(await possibleInstruments)
    if (!transactingInstrument) return

    const mentionSummary = formatters.generateMentionSummary(sender, msg.message, transactingInstrument)

    const transactionMessage = client.sendMessage(
      config.get('transactions.reportingChannel'),
      { message: mentionSummary, linkPreview: false }
    )

    if (Math.abs(senti) > config.get('transactions.sentimentThreshold')) {
      client.editMessage(
        config.get('transactions.reportingChannel'),
        {
          message: (await transactionMessage).id,
          text: [mentionSummary, '🥱 <b>Not transacting:</b> emotion not strong enough'].join('\r\n')
        }
      )
      return
    }

    const quantity = Math.sign(senti)
    if (quantity === 0) return

    let append
    try {
      const order = await orders.placeMarketOrder(transactingInstrument.ticker, quantity)
      append = formatters.generateOrderSummary(order)
    } catch (err) {
      console.dir(err)
      const direction = Math.sign(JSON.parse(err.config.data).quantity) > 0 ? 'buy' : 'sell'
      const reasons = {
        SellingEquityNotOwned: 'we didn\'t own enough of the equity to sell',
        'Close only mode': 'the instrument is in close-only mode',
        InsufficientFreeForStocksException: 'we didn\'t have enough cash to cover the transaction'
      }
      const reason = reasons[err.response.data.clarification] ?? `<code>${err.response.data.clarification}</code>`
      append = `❌ <b>Tried to ${direction}</b> but ${reason}`
    } finally {
      client.editMessage(
        config.get('transactions.reportingChannel'),
        {
          message: (await transactionMessage).id,
          text: [mentionSummary, append].join('\r\n')
        }
      )
    }

    client.invoke(
      new Api.messages.SetTyping({
        peer: config.get('transactions.reportingChannel'),
        action: new Api.SendMessageCancelAction({})
      })
    )
  }, new NewMessage())

  const updateCash = async () => {
    const cash = formatters.generateCashSummary('emoji')
    try {
      await client.invoke(
        new Api.channels.EditTitle({
          peer: config.get('transactions.reportingChannel'),
          about: (await cash) + ' TrashZone Trading'
        })
      ).catch(() => null)
    } catch (e) {
      if (e.errorMessage === 'CHAT_NOT_MODIFIED') return
      throw e
    } finally {
      setTimeout(updateCash, 1000 * 60 * 5)
    }
  }
  updateCash()
}

main()
