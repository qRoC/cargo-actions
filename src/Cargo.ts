// This file is part of the fibiol.com.
//
// (c) Andrey Savitsky <contact@qroc.pro>

import {CargoOutputListener, CargoOutputListeners} from './CargoOutputListener'
import * as exec from '@actions/exec'
import {
  Artifact,
  BuildFinished,
  BuildScript,
  CompilerMessage,
  MessageType,
  parseMessage
} from './metadata/messages'
import {CargoProject} from './CargoProject'
import os from 'os'

///
export class Cargo {
  ///
  private readonly project: CargoProject

  ///
  private readonly listeners: CargoOutputListeners

  ///
  constructor(project: CargoProject) {
    this.project = project
    this.listeners = new CargoOutputListeners()
  }

  ///
  addListener(listener: CargoOutputListener): void {
    this.listeners.addListener(listener)
  }

  ///
  async runCommand(command: string, args: string[]): Promise<number> {
    let outBuffer = ''
    let errBuffer = ''
    const resultCode = await exec.exec(
      'cargo',
      [
        this.project.toolchain,
        command,
        this.isFormatterSupport(command) ? '--message-format=json' : '',
        ...args
      ].filter(Boolean),
      {
        cwd: `${process.cwd()}/${this.project.manifestPath}`,
        silent: true,
        ignoreReturnCode: true,
        listeners: {
          stdout: (data: Buffer) => {
            outBuffer = Cargo.processLineBuffer(
              data,
              outBuffer,
              this.processOutputLine
            )
          },
          stderr: (data: Buffer) => {
            errBuffer = Cargo.processLineBuffer(
              data,
              errBuffer,
              this.processErrorLine
            )
          },
          debug: this.processOutputLine
        }
      }
    )

    await this.listeners.finalize()

    return resultCode
  }

  ///
  private processOutputLine = (line: string): boolean => {
    // eslint-disable-next-line no-invalid-this
    const listeners = this.listeners
    const [type, record] = parseMessage(line)
    switch (type) {
      case MessageType.CompilerArtifact:
        return listeners.artifact(record as Artifact)
      case MessageType.CompilerMessage:
        return listeners.compilerMessage(record as CompilerMessage)
      case MessageType.BuildScriptExecuted:
        return listeners.buildScript(record as BuildScript)
      case MessageType.BuildFinished:
        return listeners.buildFinished(record as BuildFinished)
      case MessageType.TextLine:
        return listeners.textLine(line, false)
    }

    throw new Error(`Runtime error: Unknown record type ${type}`)
  }

  ///
  private processErrorLine = (line: string): boolean => {
    // eslint-disable-next-line no-invalid-this
    return this.listeners.textLine(line, true)
  }

  private isFormatterSupport(command: string): boolean {
    return command !== 'fmt' && command !== 'audit'
  }

  private static processLineBuffer(
    data: Buffer,
    strBuffer: string,
    onLine: (line: string) => void
  ): string {
    const EOL = '\n'

    let s = strBuffer + data.toString()
    let n = s.indexOf(EOL)

    while (n > -1) {
      const line = s.substring(0, n)
      onLine(line)

      // the rest of the string ...
      s = s.substring(n + EOL.length)
      n = s.indexOf(EOL)
    }

    return s
  }
}
