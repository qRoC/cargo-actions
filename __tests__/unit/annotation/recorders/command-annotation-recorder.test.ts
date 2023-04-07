// This file is part of the cargo-actions.
//
// Copyright (c) Andrii Savytskyi <contact@qroc.pro>
//
// For the full copyright and license information, please view
// the LICENSE file that was distributed with this source code.

import { CommandAnnotationRecorder } from '../../../../src/annotation/recorders/command-annotation-recorder'
import { Annotation, AnnotationBlock } from '../../../../src/annotation'

describe('CommandAnnotationRecorder', () => {
  beforeAll(() => {
    jest.spyOn(process.stdout, 'write').mockImplementation((): boolean => true)
  })

  it('handle notices', async () => {
    const recorder = new CommandAnnotationRecorder()
    recorder.addAnnotation(new Annotation('notice', AnnotationBlock.create('test', 123), 'MESSAGE'))
    await recorder.finalize()

    expect(process.stdout.write).toHaveBeenCalledTimes(1)
    expect(process.stdout.write).toHaveBeenCalledWith('::warning file=test,line=123::MESSAGE\n')
  })

  it('handle warnings', async () => {
    const recorder = new CommandAnnotationRecorder()
    recorder.addAnnotation(new Annotation('warning', AnnotationBlock.create('test', 123), 'MESSAGE'))
    await recorder.finalize()

    expect(process.stdout.write).toHaveBeenCalledTimes(1)
    expect(process.stdout.write).toHaveBeenCalledWith('::warning file=test,line=123::MESSAGE\n')
  })

  it('handle failures', async () => {
    const recorder = new CommandAnnotationRecorder()
    recorder.addAnnotation(new Annotation('failure', AnnotationBlock.create('test', 123), 'MESSAGE'))
    await recorder.finalize()

    expect(process.stdout.write).toHaveBeenCalledTimes(1)
    expect(process.stdout.write).toHaveBeenCalledWith('::error file=test,line=123::MESSAGE\n')
  })

  it('handle group of messages', async () => {
    const recorder = new CommandAnnotationRecorder()

    recorder.addAnnotation(new Annotation('notice', AnnotationBlock.create('test/src/a.rs', 123, 127, 5), 'MESSAGE'))
    recorder.addAnnotation(new Annotation('warning', AnnotationBlock.create('test/src/a.rs', 123, 127, 5), 'MESSAGE'))
    recorder.addAnnotation(new Annotation('failure', AnnotationBlock.create('test/src/a.rs', 123, 127, 5), 'MESSAGE'))

    recorder.addAnnotation(new Annotation('notice', AnnotationBlock.create('test/src/a.rs', 1, 1, 56), 'MESSAGE'))
    recorder.addAnnotation(new Annotation('warning', AnnotationBlock.create('test/src/a.rs', 2, 2, 64), 'MESSAGE'))
    recorder.addAnnotation(new Annotation('failure', AnnotationBlock.create('test/src/a.rs', 3, 3, 33), 'MESSAGE'))

    await recorder.finalize()

    expect(process.stdout.write).toHaveBeenCalledTimes(6)
    expect(process.stdout.write).toHaveBeenCalledWith('::warning file=test/src/a.rs,line=123::MESSAGE\n')
    expect(process.stdout.write).toHaveBeenCalledWith('::warning file=test/src/a.rs,line=123::MESSAGE\n')
    expect(process.stdout.write).toHaveBeenCalledWith('::error file=test/src/a.rs,line=123::MESSAGE\n')
    expect(process.stdout.write).toHaveBeenCalledWith('::warning file=test/src/a.rs,line=1,col=56::MESSAGE\n')
    expect(process.stdout.write).toHaveBeenCalledWith('::warning file=test/src/a.rs,line=2,col=64::MESSAGE\n')
    expect(process.stdout.write).toHaveBeenCalledWith('::error file=test/src/a.rs,line=3,col=33::MESSAGE\n')
  })
})
