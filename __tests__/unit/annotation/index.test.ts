// This file is part of the fibiol.com.
//
// (c) Andrey Savitsky <contact@qroc.pro>

import {AnnotationBlock} from '../../../src/annotation'

describe('AnnotationBlock.create', () => {
  it('auto set endLine', () => {
    const block = AnnotationBlock.create('test', 1)
    expect(block.file).toStrictEqual('test')
    expect(block.startLine).toStrictEqual(1)
    expect(block.endLine).toStrictEqual(1)
    expect(block.startColumn).toStrictEqual(undefined)
    expect(block.endColumn).toStrictEqual(undefined)
  })

  it('accept custom endLine', () => {
    const block = AnnotationBlock.create('test', 1, 2)
    expect(block.file).toStrictEqual('test')
    expect(block.startLine).toStrictEqual(1)
    expect(block.endLine).toStrictEqual(2)
    expect(block.startColumn).toStrictEqual(undefined)
    expect(block.endColumn).toStrictEqual(undefined)
  })

  it('remove column info if this is multi line block', () => {
    const block = AnnotationBlock.create('test', 1, 2, 3, 4)
    expect(block.file).toStrictEqual('test')
    expect(block.startLine).toStrictEqual(1)
    expect(block.endLine).toStrictEqual(2)
    expect(block.startColumn).toStrictEqual(undefined)
    expect(block.endColumn).toStrictEqual(undefined)
  })

  it('accept startColumn info if this is one line block', () => {
    const block = AnnotationBlock.create('test', 1, 1, 3)
    expect(block.file).toStrictEqual('test')
    expect(block.startLine).toStrictEqual(1)
    expect(block.endLine).toStrictEqual(1)
    expect(block.startColumn).toStrictEqual(3)
    expect(block.endColumn).toStrictEqual(3)
  })

  it('accept column info if this is one line block', () => {
    const block = AnnotationBlock.create('test', 1, 1, 3, 4)
    expect(block.file).toStrictEqual('test')
    expect(block.startLine).toStrictEqual(1)
    expect(block.endLine).toStrictEqual(1)
    expect(block.startColumn).toStrictEqual(3)
    expect(block.endColumn).toStrictEqual(4)
  })
})
