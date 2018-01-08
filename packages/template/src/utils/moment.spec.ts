import { templateLocalTime,MomentOptions } from '../utils/moment.helper'
// import { Mock, Times, It } from 'typemoq'

test('test Timezone and Format of Date', async () => {
  const date = '2017-08-16T13:04:33.977Z'
  const moments: MomentOptions = {
    hash: {
      format: 'DD.MM.YYYY HH:mm',
      tz: 'Europe/Berlin'
    }
  }
  const moment = await templateLocalTime(date,moments)
  if (!moment.hash) {
    if (moments.hash.format !== '' && moments.hash.tz !== '') {
      expect(moment).toBe('16.08.2017 15:04')
    } else if (moments.hash.format !== '') {
      expect(moment).toBe('16.08.2017 13:04')
    } else if (moments.hash.tz !== '') {
      expect(moment).toBe('16.08.2017 15:04')
    }
  }
})
