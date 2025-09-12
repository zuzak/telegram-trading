const { NewMessage } = require('telegram/events')
const { Api } = require('telegram')
const instruments = require('./instruments.js')
const sentiment = require('./sentiment.js')
const orders = require('./orders.js')
const formatters = require('./formatters.js')
const config = require('./config.js')
const pendingOrders = require('./pendingOrders.js')

const fs = require('fs')
const stream = fs.createWriteStream(config.get('logging.file'), { flags: 'a' })

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

    const possibleInstruments = instruments.searchStringForInstruments(
      msg.message.replace(/[‘’]/g, "'")
    )
    const senti = sentiment.getSentiment(msg.message)

    const username = formatters.formatUsername(sender)
    if (!username) return // probably a channel
    console.log(
      new Date(msg.date * 1000),
      username,
      msg.message,
      senti
    )

    let ircNick = username
    if (msg.viaBotId) {
      if (msg.viaBotId === '5450586675') {
        ircNick = username + '|doovlabot'
      } else {
        ircNick = username + '|' + msg.viaBotId
      }
    }

    if (config.get('logging.enabled')) {
      for (const line of msg.message.split('\n')) {
        stream.write([
          (new Date(msg.date * 1000)).toISOString().replace('T', ' ').replace(/\..*$/, ''),
          ircNick,
          line + '\n'
        ].join('\t'))
      }
    }
    const transactingInstrument = orders.selectInstrument(await possibleInstruments)
    if (!transactingInstrument) return

    const mentionSummary = formatters.generateMentionSummary(sender, msg, transactingInstrument, senti)

    const transactionMessage = client.sendMessage(
      config.get('transactions.reportingChannel'),
      { message: mentionSummary /* + '\r\n🤔 Processing…' */, linkPreview: false }
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

    if (
      quantity > 0 &&
      config.get('transactions.excludedSecurities').includes(transactingInstrument.ticker)
    ) {
      client.editMessage(
        config.get('transactions.reportingChannel'),
        {
          message: (await transactionMessage).id,
          linkPreview: false,
          text: [
            mentionSummary,
            '🫷 <b>Not transacting:</b> security on ignore list'
          ].join('\r\n')
        }
      )
      return
    }

    console.log('Starting transaction', transactingInstrument)

    if (transactingInstrument.currencyCode === 'GBX') {
      // if denominated in pence multiply by 10 as a quick way to make it "US-like"
      quantity = quantity * config.get('transactions.gbxConversion')
    }
    if (quantity < 0 && config.get('transactions.onlySellIfProfitable')) { // if selling
      console.log('We\'re selling')
      try {
        const existingHoldings = await instruments.getOpenPosition(transactingInstrument.ticker)
        if (existingHoldings) {
          limitPrice = existingHoldings.averagePrice
          const multiplier = config.get('transactions.flipMultiplier')
          if (multiplier) limitPrice = limitPrice + (limitPrice * multiplier)
        }
        console.log('Existing', existingHoldings)
      } catch (e) {
        console.log('Error with getting holding')
        console.dir(e)
      }
    }

    try {
      const order = await orders.placeOrder(transactingInstrument.ticker, quantity, limitPrice)
      console.log('PLACED ERR ORDER', order)
      pendingOrders(await transactionMessage, mentionSummary, order, mentionSummary, 1000)
    } catch (err) {
      console.log('Error placing order')
      console.dir(err)
      const direction = Math.sign(JSON.parse(err.config.data).quantity) > 0 ? 'buy' : 'sell'
      const reasons = {
        SellingEquityNotOwned: 'we didn\'t own enough of the equity to sell',
        'Close only mode': 'the instrument is in close-only mode',
        InsufficientFreeForStocksException: 'we didn\'t have enough cash to cover the transaction',
        InternalError: 'upstream replied with an 💥internal server error',
        'Too many requests': 'we got rate limited 🫸'
      }
      let reason = ((x) => {
        if (x.clarification) return x.clarification
        if (x.errorMessage) return x.errorMessage
        if (x.code) return x.code
        return JSON.stringify(x)
      })(err.response.data)
      if (reason = '""') reason = err.response.statusText
      if (reasons[reason]) reason = reasons[reason]

      client.editMessage(
        config.get('transactions.reportingChannel'),
        {
          message: (await transactionMessage).id,
          linkPreview: false,
          text: [
            mentionSummary,
            `❌ <b>Tried to ${direction}</b> but ${reason}`,
            `<pre><code language="json">${err.config.data}</code></pre>`
          ].join('\r\n')
        }
      )
    } finally {
      client.invoke(
        new Api.messages.SetTyping({
          peer: config.get('transactions.reportingChannel'),
          action: new Api.SendMessageCancelAction({})
        })
      )
    }
  }, new NewMessage())
}
