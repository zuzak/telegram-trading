const { expect, test, describe } = require('@jest/globals')
const formatters = require('./formatters.js')

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
})
describe('order summary', () => {
  test('works on a buy', () => {
    const order = { quantity: 1, ticker: 'XXX', type: 'MARKET' }
    expect(formatters.generateOrderSummary(order)).toBe(
      'Buying 1× <code>XXX</code> at next available price'
    )
  })
  test('works on a sell', () => {
    const order = { quantity: -1, ticker: 'XXX', type: 'MARKET' }
    expect(formatters.generateOrderSummary(order)).toBe(
      'Selling 1× <code>XXX</code> at next available price'
    )
  })
  test('works on a non-market order ', () => {
    const order = { quantity: -1, ticker: 'XXX', type: 'LIMIT' }
    expect(formatters.generateOrderSummary(order)).toBe(
      'Selling 1× <code>XXX</code>'
    )
  })
})
