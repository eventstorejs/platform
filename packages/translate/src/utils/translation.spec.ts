// import { Mock, Times, It } from 'typemoq'

import { TranslateDefaultParser, Translation } from '@eventstorejs/translate'

test('test resolve using non tenant', async () => {
  const translations = {
    'KEY' : 'VALUE',
    'HELLO' : 'Hallo {{value}}',
    'DEEP' : {
      'KEY' : 'v'
    }
  }
  const translation = new Translation('de', 'default', translations, new TranslateDefaultParser())

  expect(translation.get('KEY')).toBe('VALUE')
  expect(translation.get('UNKNOWN')).toBe('UNKNOWN')
  expect(translation.get('HELLO', {value: 'Me'})).toBe('Hallo Me')
  expect(translation.get('DEEP.KEY')).toBe('v')

})
