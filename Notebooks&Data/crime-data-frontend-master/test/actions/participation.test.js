/* eslint no-undef: 0, no-console: 0 */

import sinon from 'sinon'

import {
  UCR_PARTICIPATION_FAILED,
  UCR_PARTICIPATION_FETCHING,
  UCR_PARTICIPATION_RECEIVED,
} from '../../src/actions/constants'
import {
  failedUcrParticipation,
  fetchingUcrParticipation,
  receivedUcrParticipation,
  fetchUcrParticipation,
} from '../../src/actions/participation'
import { nationalKey } from '../../src/util/api/constants'
import api from '../../src/util/api/participation'

const createPromise = (res, err) => {
  if (!err) return Promise.resolve(res)
  return Promise.reject(err)
}

describe('ucr actions', () => {
  let sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('failedUcrParticipation()', () => {
    it('should return UCR_PARTICIPATION_FAILED type', () => {
      const actual = failedUcrParticipation()
      expect(actual.type).toEqual(UCR_PARTICIPATION_FAILED)
    })
  })

  describe('fetchingUcrParticipation()', () => {
    it('should return UCR_PARTICIPATION_FETCHING type', () => {
      const actual = fetchingUcrParticipation()
      expect(actual.type).toEqual(UCR_PARTICIPATION_FETCHING)
    })
  })

  describe('receivedUcrParticipation()', () => {
    const action = {
      'north-carolina': [1, 2, 3],
    }

    it('should return a UCR_PARTICIPATION_RECEIVED type action', () => {
      const actual = receivedUcrParticipation(action)
      expect(actual.type).toEqual(UCR_PARTICIPATION_RECEIVED)
      expect(actual.results['north-carolina']).toEqual([1, 2, 3])
    })
  })

  describe('fetchUcrParticipation()', () => {
    it('should trigger fetching and received actions', done => {
      const dispatch = sandbox.spy()
      const fn0 = () => createPromise({ place: nationalKey, results: [] })
      const fn1 = () => createPromise({ place: 'california', results: [] })
      sandbox.stub(api, 'getNationalParticipation', fn0)
      sandbox.stub(api, 'getStateParticipation', fn1)

      const filter = { place: 'california', placeType: 'state', placeId: 'ca' }
      fetchUcrParticipation(filter)(dispatch).then(() => {
        const first = dispatch.getCall(0)
        const second = dispatch.getCall(1)
        expect(first.args[0].type).toEqual(UCR_PARTICIPATION_FETCHING)
        expect(second.args[0].type).toEqual(UCR_PARTICIPATION_RECEIVED)
        done()
      })
    })

    it('should call getNationalParticipation and getStateParticipation', done => {
      const dispatch = sandbox.spy()
      const fn0 = () => createPromise({ place: nationalKey, results: [] })
      const fn1 = () => createPromise({ place: 'california', results: [] })
      const spy0 = sandbox.stub(api, 'getNationalParticipation', fn0)
      const spy1 = sandbox.stub(api, 'getStateParticipation', fn1)

      const filter = { place: 'california', placeType: 'state', placeId: 'ca' }
      fetchUcrParticipation(filter)(dispatch).then(() => {
        expect(spy0.callCount).toEqual(1)
        expect(spy1.callCount).toEqual(1)
        done()
      })
    })

    it('should dispatch UCR_PARTICIPATION_FAILED if API call fails', done => {
      const dispatch = sandbox.spy()
      const fn = () => Promise.reject(true)
      sandbox.stub(api, 'getNationalParticipation', fn)
      sandbox.stub(api, 'getStateParticipation', fn)

      const filter = { place: 'california', placeType: 'state', placeId: 'ca' }
      fetchUcrParticipation(filter)(dispatch).then(() => {
        const dispatched = dispatch.getCall(1)
        expect(dispatched.args[0].type).toEqual('UCR_PARTICIPATION_FAILED')
        done()
      })
    })
  })
})
