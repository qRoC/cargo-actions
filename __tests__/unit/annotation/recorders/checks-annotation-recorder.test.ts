// This file is part of the cargo-actions.
//
// Copyright (c) Andrii Savytskyi <contact@qroc.pro>
//
// For the full copyright and license information, please view
// the LICENSE file that was distributed with this source code.

import { ChecksAnnotationRecorder } from '../../../../src/annotation/recorders/checks-annotation-recorder'
import { Annotation, AnnotationBlock, AnnotationLevel } from '../../../../src/annotation'
import { RequestError } from '@octokit/request-error'
import nock = require('nock')

async function runRecord(annotationCount: number) {
  const recorder = new ChecksAnnotationRecorder(
    'myToken',
    'myOwner',
    'myRepo',
    'Test checks',
    'abcdefg'
  )

  for (let i = 0; i < annotationCount; i++) {
    let level: AnnotationLevel = 'notice'
    if (i % 3 === 0) {
      level = 'warning'
    } else if (i % 4 === 0) {
      level = 'failure'
    }

    recorder.addAnnotation(new Annotation(level, AnnotationBlock.create('test', i), `${level}: ${i}`))
  }

  await recorder.finalize()
}

function baseChecker(body: any, status: 'queued' | 'in_progress' | 'completed'): void {
  expect(body.name).toStrictEqual('Test checks')
  expect(body.head_sha).toStrictEqual('abcdefg')
  expect(body.status).toStrictEqual(status)
  expect(body.output.title).toStrictEqual('Test checks')
}


describe('ChecksAnnotationRecorder', () => {
  beforeEach(() => {
    if (!nock.isActive()) {
      nock.activate()
    }
  })

  afterEach(() => {
    nock.restore()
    nock.cleanAll()
  })

  it('should throw error if 400 returned', async () => {
    const scope = nock('https://api.github.com')
      .post('/repos/myOwner/myRepo/check-runs')
      .once()
      .reply(400)

    await expect(runRecord(1)).rejects.toThrow(RequestError)
    expect(scope.pendingMocks()).toHaveLength(0)
  })

  it('should work with the API correctly', async () => {
    const scope = nock('https://api.github.com')
      // create [-50]
      .post('/repos/myOwner/myRepo/check-runs', (body: any): boolean => {
        baseChecker(body, 'in_progress')
        expect(body.output.annotations).toHaveLength(50)
        return true
      })
      .once()
      .reply(201, {
        id: 123456
      })
      // update [-50], update [-50]
      .patch('/repos/myOwner/myRepo/check-runs/123456', (body: any): boolean => {
        baseChecker(body, 'in_progress')
        expect(body.output.annotations).toHaveLength(50)
        return true
      })
      .twice()
      .reply(200)
      // update [-10]
      .patch('/repos/myOwner/myRepo/check-runs/123456', (body: any): boolean => {
        baseChecker(body, 'in_progress')
        expect(body.output.annotations).toHaveLength(10)
        return true
      })
      .once()
      .reply(200)
      // change status
      .patch('/repos/myOwner/myRepo/check-runs/123456', (body: any): boolean => {
        baseChecker(body, 'completed')
        expect(body.conclusion).toStrictEqual('failure')
        expect(body.output.annotations).toHaveLength(0)
        expect(body.output.summary).toStrictEqual(
          'There are 26 failures, 54 warnings, and 80 notice.'
        )
        return true
      })
      .once()
      .reply(200)

    await runRecord(160)

    expect(scope.pendingMocks()).toHaveLength(0)
  })

  it('should end with success if has only warnings', async () => {
    const scope = nock('https://api.github.com')
      .post('/repos/myOwner/myRepo/check-runs', (body: any): boolean => {
        baseChecker(body, 'in_progress')
        expect(body.output.annotations).toHaveLength(4)
        return true
      })
      .once()
      .reply(201, {
        id: 123456
      })
      // change status
      .patch('/repos/myOwner/myRepo/check-runs/123456', (body: any): boolean => {
        baseChecker(body, 'completed')
        expect(body.conclusion).toStrictEqual('success')
        expect(body.output.annotations).toHaveLength(0)
        expect(body.output.summary).toStrictEqual(
          'There are 0 failures, 2 warnings, and 2 notice.'
        )
        return true
      })
      .once()
      .reply(200)

    await runRecord(4)

    expect(scope.pendingMocks()).toHaveLength(0)
  })

  it('should end with success if no annotations', async () => {
    const scope = nock('https://api.github.com')
      .post('/repos/myOwner/myRepo/check-runs', (body: any): boolean => {
        baseChecker(body, 'in_progress')
        expect(body.output.annotations).toHaveLength(0)
        return true
      })
      .once()
      .reply(201, {
        id: 123456
      })
      // change status
      .patch('/repos/myOwner/myRepo/check-runs/123456', (body: any): boolean => {
        baseChecker(body, 'completed')
        expect(body.conclusion).toStrictEqual('success')
        expect(body.output.annotations).toHaveLength(0)
        expect(body.output.summary).toStrictEqual(
          'There are 0 failures, 0 warnings, and 0 notice.'
        )
        return true
      })
      .once()
      .reply(200)

    await runRecord(0)

    expect(scope.pendingMocks()).toHaveLength(0)
  })
})
