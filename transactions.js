const { NewMessage } = require('telegram/events')
const { Api } = require('telegram')
const instruments = require('./instruments.js')
const sentiment = require('./sentiment.js')
const orders = require('./orders.js')
const formatters = require('./formatters.js')
const config = require('./config.js')

module.exports = async (client) => {
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

    const mentionSummary = formatters.generateMentionSummary(sender, msg, transactingInstrument, senti)

    const transactionMessage = client.sendMessage(
      config.get('transactions.reportingChannel'),
      { message: mentionSummary, linkPreview: false }
    )

    if (Math.abs(senti) < config.get('transactions.sentimentThreshold')) {
      const yawnEmoji = senti === 0 ? '😪' : '🥱'
      client.editMessage(
        config.get('transactions.reportingChannel'),
        {
          message: (await transactionMessage).id,
          linkPreview: false,
          text: [
            mentionSummary,
            `${yawnEmoji} <b>Not transacting:</b> emotion not strong enough`
          ].join('\r\n')
        }
      )
      return
    }

    let quantity = Math.sign(senti)
    let limitPrice = null
    if (quantity === 0) return

    console.log('Starting transaction', transactingInstrument)

    let append
    try {
      if (transactingInstrument.currencyCode === 'GBX') {
        // if denominated in pence multiply by 10 as a quick way to make it "US-like"
        quantity = quantity * config.get('transactions.gbxConversion')
      }
      if (quantity < 0) { // if selling
        console.log('We\'re selling')
        try {
          const existingHoldings = await instruments.getOpenPosition(transactingInstrument.ticker)
          if (existingHoldings) {
            limitPrice = existingHoldings.averagePrice
          }
          console.log('Existing', existingHoldings)
        } catch (e) {
          console.log('Error with getting holding')
          console.dir(e)
        }
      }

      const order = await orders.placeOrder(transactingInstrument.ticker, quantity, limitPrice)
      append = formatters.generateOrderSummary(order)
    } catch (err) {
      console.log('Error placing order')
      console.dir(err)
      const direction = Math.sign(JSON.parse(err.config.data).quantity) > 0 ? 'buy' : 'sell'
      const reasons = {
        SellingEquityNotOwned: 'we didn\'t own enough of the equity to sell',
        'Close only mode': 'the instrument is in close-only mode',
        InsufficientFreeForStocksException: 'we didn\'t have enough cash to cover the transaction',
        InternalError: 'upstream replied with an ⛓️‍💥internal server error'
      }
      let reason = ((x) => {
        if (x.clarification) return x.clarification
        if (x.errorMessage) return x.errorMessage
        if (x.code) return x.code
        return JSON.stingify(x)
      })(err.response.data)
      if (reasons[reason]) reason = reasons[reason]
      append = `❌ <b>Tried to ${direction}</b> but ${reason}`
    } finally {
      client.editMessage(
        config.get('transactions.reportingChannel'),
        {
          message: (await transactionMessage).id,
          linkPreview: false,
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
}
