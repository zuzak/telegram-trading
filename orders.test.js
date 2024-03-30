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
describe('describe orders', () => {
  test('returns stuff on success', async () => {
    axios.get.mockImplementationOnce(() => Promise.resolve({ data: exampleOrder }))

    const output = await orders.getOrder(0)
    expect(output).toStrictEqual(exampleOrder)
  })
})
describe('order picker', () => {
  test('returns the first order', () => {
    const x = ['a', 'b']
    expect(orders.selectInstrument(x)).toBe('a')
  })
})
