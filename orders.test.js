const { expect, jest, test, describe } = require('@jest/globals')
const orders = require('./orders.js')

const axios = require('axios')
jest.mock('axios')

const exampleOrder = {
  creationTime: '2019-08-24T14:15:22Z',
  filledQuantity: 0,
  filledValue: 0,
  id: 0,
  limitPrice: 0,
  quantity: 0,
  status: 'LOCAL',
  stopPrice: 0,
  strategy: 'QUANTITY',
  ticker: 'AAPL_US_EQ',
  type: 'LIMIT',
  value: 0
}

describe('market orders', () => {
  test('returns stuff on success', async () => {
    axios.post.mockImplementationOnce(() => Promise.resolve({ data: exampleOrder }))

    const output = await orders.placeMarketOrder('AAPL_US_EQ', 1)
    expect(output).toStrictEqual(exampleOrder)
  })
})
describe('market orders', () => {
  test('returns stuff on success', async () => {
    axios.post.mockImplementationOnce(() => Promise.resolve({ data: exampleOrder }))

    const output = await orders.placeLimitOrder('AAPL_US_EQ', 1, 1)
    expect(output).toStrictEqual(exampleOrder)
  })
})
describe('describe orders', () => {
  test('returns stuff on success', async () => {
    axios.get.mockImplementationOnce(() => Promise.resolve({ data: exampleOrder }))

    const output = await orders.getOrder(0)
    expect(output).toStrictEqual(exampleOrder)
  })
})
describe('order picker', () => {
  test('prioritises GBP', () => {
    const x = [
      { currencyCode: 'EUR', ticker: 'A' },
      { currencyCode: 'GBP', ticker: 'B' },
      { currencyCode: 'USD', ticker: 'C' }
    ]
    const instrument = orders.selectInstrument(x)
    expect(instrument.ticker).toBe('B')
  })
  test('prioritises USD', () => {
    const x = [
      { currencyCode: 'USD', ticker: 'A' },
      { currencyCode: 'JPY', ticker: 'B' },
      { currencyCode: 'EUR', ticker: 'C' }
    ]
    const instrument = orders.selectInstrument(x)
    expect(instrument.ticker).toBe('A')
  })
  test('picks oldest', () => {
    const x = [
      { currencyCode: 'CAD', ticker: 'A', addedOn: '2019-08-24T14:15:22Z' },
      { currencyCode: 'JPY', ticker: 'B', addedOn: '2021-03-01T12:00:33Z' },
      { currencyCode: 'EUR', ticker: 'C', addedOn: '2009-01-01T04:32:00Z' }
    ]
    const instrument = orders.selectInstrument(x)
    expect(instrument.ticker).toBe('C')
  })
})
