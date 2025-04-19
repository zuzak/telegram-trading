const { Api } = require('telegram')
const { getOrders } = require('./orders.js')
const { NewMessage } = require('telegram/events')
const formatters = require('./formatters.js')
const config = require('./config.js')
const { execSync } = require('node:child_process')
const { readFileSync } = require('node:fs')

let yumCount = 0

module.exports = (client) => {
  client.addEventHandler(async (event) => {
    if (!event.message) return

    const firstWord = event.message.message.split(' ')[0]
    let command = firstWord.substr(1)
    if (!firstWord.startsWith('/')) return
    if (firstWord.includes('@')) {
      if (firstWord.substring(firstWord.indexOf('@')) !== '@TrashzoneTradingBot') {
        return
      }
      command = firstWord.substring(0, firstWord.indexOf('@')).substr(1)
    }

    if (commands[command]) {
      const reply = await commands[command].cmd(event.message)
      if (typeof reply === 'string') {
        return event.message.reply({
          message: reply,
          linkPreview: false
        })
      }
      if (typeof reply === 'object') {
        return event.message.reply({
          message: `<pre language="json">${JSON.stringify(reply, null, 4)}</pre>`
        })
      }
      return reply
    }
  }, new NewMessage())

  updateBotCommands(client)
}

const commands = {
  botsnack: {
    desc: 'Gives the bot a snack',
    cmd: () => {
      const excl = '!'
      return `Yum${excl.repeat(yumCount++)}`
    }
  },
  accountcash: {
    desc: 'Get a summary of our current cash holdings',
    cmd: async (message) => formatters.generateCashSummary('paragraph')
  },
  openorders: {
    desc: 'List all orders waiting for fulfillment',
    cmd: async () => {
      const orders = await getOrders()
      const sentences = orders.map(async (x) => `${await formatters.generateOrderSummary(x)}`)
      return (await Promise.all(sentences)).join('\r\n')
    }
  },
  invitelink: {
    desc: 'Gets an invite link for the bot announce channel',
    cmd: () => config.get('telegram.inviteLink').toString()
  },
  lobo: {
    desc: null,
    cmd: (message) => {
      if (Math.random() < 0.2) {
        message.respond({ // like .reply but without a quote
          message: '/lobo',
          linkPreview: false
        })
      }
    }
  },
  version: {
    desc: 'Get the version information of the bot',
    cmd: () => {
      return [
        `telegram-trading 🤖 <code>${execSync('git describe --always --dirty')}</code>`,
        'https://github.com/zuzak/telegram-trading',
        '<blockquote>',
        readFileSync('LICENSE'),
        '</blockquote>'
      ].filter(Boolean).join('\r\n')
    }
  }
}

const updateBotCommands = (client) => {
  const cmds = Object.keys(commands).map((x) => {
    if (!commands[x].desc) return null
    return new Api.BotCommand({
      command: x,
      description: commands[x].desc
    })
  }).filter(Boolean)

  client.invoke(
    new Api.bots.SetBotCommands({
      scope: new Api.BotCommandScopeDefault({}),
      langCode: 'en',
      commands: cmds
    })
  )
}
