const t212 = require('./t212.js')
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
  generateOrderSummary: (order) => {
    return [
      Math.sign(order.quantity) > 0 ? 'Buying' : 'Selling',
      Math.abs(order.quantity) + '×',
      `<code>${order.ticker}</code>`,
      order.type === 'MARKET' ? 'at next available price' : null
    ].filter(Boolean).join(' ')
  },
  generateCashSummary: async (variant) => {
    // this should probably be somewhere else
    const cash = (await t212.get('equity/account/cash')).data
    const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', notation: 'compact' })
    const fictionality = config.get('trading212.env') === 'demo' ? 'fictional' : '<u>real</u>'
    console.dir(cash)
    const emoji = {
      1: '📈',
      '-1': '📉',
      0: '🏛️'
    }[Math.sign(cash.ppl)]
    switch (variant) {
      case 'paragraph':
        return [
          `Our ${fictionality} account value is ${fmt.format(cash.total)}.`,
          'We started with £10,000.',
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
        return `${emoji} TrashZone Trading · ${fmt.format(cash.free)}`
    }
    return cash
  }
}
