// This file is part of the cargo-actions.
//
// Copyright (c) Andrii Savytskyi <contact@qroc.pro>
//
// For the full copyright and license information, please view
// the LICENSE file that was distributed with this source code.

import {AnnotationRecorder, Annotation, AnnotationLevel} from '../index'
import {issueCommand} from '@actions/core/lib/command'
import {info} from '@actions/core'

export class CommandAnnotationRecorder implements AnnotationRecorder {
  private info: string[] = []
  private readonly stats: Record<AnnotationLevel, number>

  constructor() {
    this.stats = {
      notice: 0,
      warning: 0,
      failure: 0
    }
  }

  noticeCount(): number {
    return this.stats.notice
  }

  warningCount(): number {
    return this.stats.warning
  }

  failureCount(): number {
    return this.stats.failure
  }

  addAnnotation(annotation: Annotation): void {
    const level = CommandAnnotationRecorder.processLevel(annotation.level)
    const properties = {
      file: annotation.block.file,
      line: annotation.block.startLine,
      col: annotation.block.startColumn
    }

    issueCommand(level, properties, annotation.message)

    this.stats[annotation.level]++
  }

  addInfoTable(
    section: string,
    title: string,
    value: string,
    rows: Record<string, string | number>
  ): void {
    const pad = CommandAnnotationRecorder.pad

    const [titleLength, valueLength] = Object.entries(rows).reduce(
      (result, [title, value]) => {
        return [
          Math.max(result[0], title.length),
          Math.max(result[1], `${value}`.length)
        ]
      },
      [title.length, value.length]
    )

    const midLine = `├${pad('', titleLength, '─')}┼${pad(
      '',
      valueLength,
      '─'
    )}┤`

    const bodyLines = []
    for (const [title, value] of Object.entries(rows)) {
      bodyLines.push(
        `│${pad(title, titleLength, ' ')}│${pad(`${value}`, valueLength, ' ')}│`
      )
    }

    this.info.push(
      [
        `\u001b[1m${section}\u001b[0m`,
        `┌${pad('', titleLength, '─')}┬${pad('', valueLength, '─')}┐`,
        `│${pad(title, titleLength, ' ', '\u001b[1m')}│${pad(
          `${value}`,
          valueLength,
          ' ',
          '\u001b[1m'
        )}│`,
        midLine,
        bodyLines.join(`\n${midLine}\n`),
        `└${pad('', titleLength, '─')}┴${pad('', valueLength, '─')}┘`
      ].join('\n')
    )
  }

  async finalize(): Promise<void> {
    if (this.info.length > 0) {
      info(this.info.join('\n\n'))
    }
  }

  private static processLevel(level: AnnotationLevel): string {
    switch (level) {
      case 'failure':
        return 'error'
      case 'warning':
      case 'notice':
        return 'warning'
    }

    throw new Error(`Unsupported level: ${level}`)
  }

  private static pad(
    str: string,
    maxSize: number,
    pad: string,
    style: string | undefined = undefined
  ): string {
    let styleOpen = ''
    let styleClose = ''
    if (style) {
      styleOpen = style
      styleClose = '\u001b[0m'
    }

    return (
      pad +
      styleOpen +
      str +
      styleClose +
      Array(maxSize + 1 - str.length).join(pad) +
      pad
    )
  }
}
