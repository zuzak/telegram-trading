const { expect, test, describe, jest } = require('@jest/globals')
const formatters = require('./formatters.js')
const axios = require('axios')

jest.mock('axios')

describe('username formatting', () => {
  test('works with a username', () => {
    const user = { username: 'foo', firstName: 'bar', lastName: 'baz' }
    expect(formatters.formatUsername(user)).toBe('@foo')
  })
  test('works with a name name', () => {
    const user = { username: null, firstName: 'bar', lastName: 'baz' }
    expect(formatters.formatUsername(user)).toBe('bar baz')
  })
})
describe('underliner', () => {
  test('works at the start', () => {
    expect(
      formatters.underlineMessage('hello world', 'hello')
    ).toBe('<u>hello</u> world')
  })
  test('works at the end', () => {
    expect(
      formatters.underlineMessage('hello world', 'world')
    ).toBe('hello <u>world</u>')
  })
  test('works in the middle', () => {
    expect(
      formatters.underlineMessage('hello world', 'lo wor')
    ).toBe('hel<u>lo wor</u>ld')
  })
  test('underlines the first instance', () => {
    expect(
      formatters.underlineMessage('hello hello world', 'hello')
    ).toBe('<u>hello</u> hello world')
  })
  test('works when there\'s no match', () => {
    expect(
      formatters.underlineMessage('hello world', 'xyzzy')
    ).toBe('hello world')
  })
})
describe('order summary', () => {
  const fakeTicker = [{ ticker: 'XXX', currencyCode: 'GBP' }]
  test('works on a new buy', async () => {
    axios.get.mockImplementationOnce(() => Promise.resolve({ data: fakeTicker }))
    const order = { quantity: 1, ticker: 'XXX', type: 'MARKET', status: 'NEW' }
    expect(await formatters.generateOrderSummary(order)).toBe(
      '⏳ Trying to buy 1× <code>XXX</code> at next available price'
    )
  })
  test('works on a new sell', async () => {
    axios.get.mockImplementationOnce(() => Promise.resolve({ data: fakeTicker }))
    const order = { quantity: -1, ticker: 'XXX', type: 'MARKET', status: 'NEW' }
    expect(await formatters.generateOrderSummary(order)).toBe(
      '⏳ Trying to sell 1× <code>XXX</code> at next available price'
    )
  })
  test('works on a new stop order', async () => {
    axios.get.mockImplementationOnce(() => Promise.resolve({ data: fakeTicker }))
    const order = { quantity: -1, ticker: 'XXX', type: 'STOP', status: 'NEW' }
    expect(await formatters.generateOrderSummary(order)).toBe(
      '⏳ Trying to sell 1× <code>XXX</code>'
    )
  })
  test('works on a new limit order', async () => {
    axios.get.mockImplementationOnce(() => Promise.resolve({ data: fakeTicker }))
    const order = { quantity: -1, ticker: 'XXX', type: 'LIMIT', limitPrice: '5.00', status: 'NEW' }
    expect(await formatters.generateOrderSummary(order)).toBe(
      '⏳ Trying to sell 1× <code>XXX</code> at <code>£5.00</code> or better'
    )
  })
  test('works on a new limit order in a non-default currency', async () => {
    const fakeTickerUsd = fakeTicker
    fakeTickerUsd[0].currencyCode = 'USD'
    axios.get.mockImplementationOnce(() => Promise.resolve({ data: fakeTickerUsd }))
    const order = { quantity: -1, ticker: 'XXX', type: 'LIMIT', limitPrice: '5.00', status: 'NEW' }
    expect(await formatters.generateOrderSummary(order)).toBe(
      '⏳ Trying to sell 1× <code>XXX</code> at <code>US$5.00</code> or better'
    )
  })
})
