// This file is part of the cargo-actions.
//
// Copyright (c) Andrii Savytskyi <contact@qroc.pro>
//
// For the full copyright and license information, please view
// the LICENSE file that was distributed with this source code.

import {CargoOutputListener} from '../cargo-output-listener'
import {
  AnnotationLevel,
  AnnotationRecorder,
  AnnotationBlock,
  Annotation
} from '../annotation'
import {CargoProject} from '../cargo-project'
import {
  Artifact,
  CompilerMessage,
  BuildScript,
  BuildFinished
} from '../metadata/messages'
import {DiagnosticLevel} from '../metadata/diagnostic'
import {BufferedStd} from '../utils/buffered-std'
import {info} from '@actions/core'

export class CompilerOutputListener implements CargoOutputListener {
  private recorder: AnnotationRecorder
  private project: CargoProject
  private bufferedStd: BufferedStd
  private compileStats: Record<DiagnosticLevel, number>

  constructor(
    recorder: AnnotationRecorder,
    project: CargoProject,
    bufferedStd: BufferedStd
  ) {
    this.recorder = recorder
    this.project = project
    this.bufferedStd = bufferedStd
    this.compileStats = {
      'error: internal compiler error': 0,
      error: 0,
      warning: 0,
      'failure-note': 0,
      note: 0,
      help: 0
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  artifact(record: Artifact): boolean {
    this.bufferedStd.flush()

    return true
  }

  buildFinished(record: BuildFinished): boolean {
    this.bufferedStd.flush()

    let message = 'Build finished'
    if (!record.success) {
      message += ' with errors'
    }

    info(message)

    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  buildScript(record: BuildScript): boolean {
    this.bufferedStd.flush()

    return true
  }

  compilerMessage(record: CompilerMessage): boolean {
    this.bufferedStd.flush()

    info(`Compiling ${record.package_id}`)

    const primarySpan = record.message.spans.find(span => span.is_primary)
    if (primarySpan === undefined) {
      this.bufferedStd.writeLine(record.message.message, false)

      return true
    }

    const block = AnnotationBlock.create(
      this.project.getFullPath(primarySpan.file_name),
      primarySpan.line_start,
      primarySpan.line_end,
      primarySpan.column_start,
      primarySpan.column_end
    )

    const annotation = new Annotation(
      CompilerOutputListener.processLevel(record.message.level),
      block,
      record.message.rendered ?? 'No details presented',
      record.message.message,
      JSON.stringify(record.message.children, null, 2)
    )

    this.recorder.addAnnotation(annotation)

    this.compileStats[record.message.level]++

    return true
  }

  textLine(record: string, isError: boolean): boolean {
    this.bufferedStd.writeLine(record, isError)

    return false
  }

  async finalize(): Promise<void> {
    this.bufferedStd.flush()

    this.recorder.addInfoTable(
      'Compile result',
      'Type',
      'Count',
      this.compileStats
    )
  }

  private static processLevel(level: DiagnosticLevel): AnnotationLevel {
    switch (level) {
      case 'error: internal compiler error':
      case 'error':
      case 'failure-note':
        return 'failure'
      case 'warning':
        return 'warning'
      case 'note':
      case 'help':
        return 'notice'
    }

    throw new Error(`Unsupported diagnostic level: ${level}`)
  }
}
