const t212 = require('./t212.js')
const instruments = require('./instruments.js')
const markets = require('./markets.js')
const config = require('./config.js')
const _ = module.exports = {
  /**
   * Returns formatted username or equivalent given a Telegram user object
   */
  formatUsername: (user) => {
    if (user.username) return `@${user.username}`
    return `${user.firstName} ${user.lastName}`
  },
  getTMeUrl: (msg) => {
    try {
      return `https://t.me/c/${msg.peerId.channelId}/${msg.id}`
    } catch (e) {
      return ''
    }
  },
  /**
   * Wraps substr in str in underline formatting
   */
  underlineMessage: (str, substr) => {
    if (!substr) return str
    if (!str.includes(substr)) return str
    const index = str.toUpperCase().indexOf(substr.toUpperCase())
    return [
      str.substr(0, index),
      '<u>' + str.substr(index, substr.length) + '</u>',
      str.substr(index + substr.length)
    ].join('')
  },
  /**
   * Outputs a nicely formatted summary of a stock mention
   */
  generateMentionSummary: (user, message, instrument, sentiment) => {
    return [
      _.formatUsername(user),
      `<a href="${_.getTMeUrl(message)}">mentioned</a>`,
      `<a href="https://markets.ft.com/data/equities/tearsheet/summary?s=${instrument.isin}">${instrument.name}</a>`,
      `$${instrument.shortName}`, // double $$ intentional (it's a cashtag)
      `<blockquote>${_.underlineMessage(message.message, instrument.name)}</blockquote>`,
      sentiment != null ? `<code>${sentiment.toFixed(3)}</code>` : ''
    ].filter(Boolean).join(' ')
  },
  /**
   * Outputs a nicely formatted summary of an order status
   * given an order object
   */
  generateOrderSummary: async (order) => {
    const instrument = await instruments.getInstrumentByTicker(order.ticker)
    const market = await markets.getMarketById(instrument.workingScheduleId)
    const direction = Math.sign(order.quantity ?? order.filledQuantity) > 0 ? 'BUY' : 'SELL'
    // LOCAL" "UNCONFIRMED" "CONFIRMED" "NEW" "CANCELLING" "CANCELLED" "PARTIALLY_FILLED" "FILLED" "REJECTED" "REPLACING" "REPLACED"
    const verbs = {
      UNCONFIRMED: 'Unconfirmed',
      CONFIRMED: 'Confirmed',
      NEW: direction === 'BUY' ? '⏳ Buying' : '⏳ Selling',
      CANCELLING: direction === 'BUY' ? '🆑 Cancelling buy order for' : '🆑 Cancelling sell order for',
      CANCELLED: direction === 'BUY' ? '🆑 Cancelled buy order for' : '🆑 Cancelled sell order for',
      PARTIALLY_FILLED: direction === 'BUY' ? '⌛ Buying' : '⌛ Selling',
      FILLED: direction === 'BUY' ? '✅ Bought' : '❎ Sold',
      REJECTED: direction === 'BUY' ? '🆑 Rejected buy order:' : '🆑 Rejected sell order: ',
      REPLACING: 'Replacing',
      REPLACED: 'Replaced'
    }

    const currencyFormat = Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: instrument.currencyCode
    })

    if (order.parentOrder) { // if historical
      return [
        `<b>${verbs[order.status]}</b>`,
        order.filledQuantity === order.orderedQuantity ? `${Math.abs(order.filledQuantity)}×` : `${order.filledQuantity} filled of ${Math.abs(order.orderedQuantity)}`,
        `<code>${order.ticker}</code>`,
        '@',
        currencyFormat.format(order.fillPrice),
        'on the',
        market.name
      ].filter(Boolean).join(' ')
    }

    return [
      `<b>${verbs[order.status]}</b>`,
      Math.abs(order.quantity) + '×',
      `<code>${order.ticker}</code>`,
      order.type === 'MARKET' ? 'at next available price' : null,
      order.type === 'LIMIT' ? `at <code>${currencyFormat.format(order.limitPrice)}</code> or better` : null,
      'on the',
      market.name,
      order.timeValidity === 'DAY' ? 'if possible before the end of the trading day' : null
    ].filter(Boolean).join(' ')
  },
  generateCashSummary: async (variant) => {
    // this should probably be somewhere else
    const cash = (await t212.get('equity/account/cash')).data
    const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', notation: 'compact' })
    const fictionality = config.get('trading212.env') === 'demo' ? 'fictional' : '<u>real</u>'
    const emoji = {
      1: '📈',
      '-1': '📉',
      0: '🏛️'
    }[Math.sign(cash.ppl)]
    const realisedProfitEmoji = cash.result > 0 ? '💸' : ''
    switch (variant) {
      case 'paragraph':
        return [
          `Our ${fictionality} account value is ${fmt.format(cash.total)}.`,
          `We started with ${fmt.format(10000)}`,
          '',
          `We have ${fmt.format(cash.invested)} invested right now.`,
          `That's a return of ${emoji} ${fmt.format(cash.ppl)}.`,
          '',
          `We have ${fmt.format(cash.free)} ${fictionality} cash left to spend, with a realised result of ${fmt.format(cash.result)}.`
        ].join('\r\n')
      case 'line':
        return [
          emoji,
          `${fmt.format(cash.invested)} invested`,
          `(${fmt.format(cash.ppl)})`,
          '·',
          `<b>${fmt.format(cash.result)} realised</b>`,
          '·',
          `${fmt.format(cash.free)} free`
        ].join(' ')
      case 'emoji':
        return emoji
      case 'strapline':
        if (cash.blocked) {
          return `${emoji}${realisedProfitEmoji} TrashZone Trading (${fmt.format(cash.total)} total · ${fmt.format(cash.free)} free · ${fmt.format(cash.blocked)} blocked`
        }
        return `${emoji}${realisedProfitEmoji} TrashZone Trading (${fmt.format(cash.total)} total · ${fmt.format(cash.free)} free)`
    }
    return cash
  }
}
