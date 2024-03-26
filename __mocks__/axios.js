// https://stackoverflow.com/questions/51393952/mock-inner-axios-create
const mockAxios = jest.genMockFromModule('axios')
mockAxios.create = jest.fn(() => mockAxios)
module.exports = mockAxios
