// This file is part of the fibiol.com.
//
// (c) Andrey Savitsky <contact@qroc.pro>

import {CargoOutputListener} from '../CargoOutputListener'
import {Annotation, AnnotationBlock, AnnotationRecorder} from '../annotation'
import {CargoProject} from '../CargoProject'
import {
  Artifact,
  CompilerMessage,
  BuildScript,
  BuildFinished
} from '../metadata/messages'

type TestStatus = 'ok' | 'ignored' | 'FAILED'

export class TestOutputListener implements CargoOutputListener {
  private recorder: AnnotationRecorder
  private project: CargoProject
  private logs: Record<string, TestStatus>

  private static regexFull = /test (?<file>.+) - (?<test>.+) \(line (?<line>\d+)\) ... (?<status>ok|ignored|FAILED)/
  private static regexShort = /test (?<test>.+) ... (?<status>ok|ignored|FAILED)/

  constructor(recorder: AnnotationRecorder, project: CargoProject) {
    this.recorder = recorder
    this.project = project
    this.logs = {}
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  artifact(record: Artifact): boolean {
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  buildFinished(record: BuildFinished): boolean {
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  buildScript(record: BuildScript): boolean {
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  compilerMessage(record: CompilerMessage): boolean {
    return false
  }

  textLine(record: string, isError: boolean): boolean {
    if (isError) {
      return false
    }

    let match = TestOutputListener.regexFull.exec(record)
    if (match && match.groups) {
      const name = `${match.groups.file}:${match.groups.line} ${match.groups.test}`

      this.logs[name] = match.groups.status as TestStatus

      if (match.groups.status === 'FAILED') {
        const annotation = new Annotation(
          'failure',
          AnnotationBlock.create(
            this.project.getFullPath(match.groups.file),
            parseInt(match.groups.line)
          ),
          'Test failed'
        )

        this.recorder.addAnnotation(annotation)
      }

      return false
    }

    match = TestOutputListener.regexShort.exec(record)
    if (match && match.groups) {
      this.logs[match.groups.test] = match.groups.status as TestStatus

      if (match.groups.status === 'FAILED') {
        const annotation = new Annotation(
          'failure',
          AnnotationBlock.create(this.project.getFullPath('Cargo.toml'), 1),
          'Test failed'
        )

        this.recorder.addAnnotation(annotation)
      }

      return false
    }

    return false
  }

  async finalize(): Promise<void> {
    if (Object.entries(this.logs).length) {
      this.recorder.addInfoTable('Test result', 'Name', 'Status', this.logs)
    }
  }
}
