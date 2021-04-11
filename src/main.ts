// This file is part of the fibiol.com.
//
// (c) Andrey Savitsky <contact@qroc.pro>

import {getInput, setFailed, setOutput} from '@actions/core'
import {CargoProject} from './CargoProject'
import {Cargo} from './Cargo'
import {ChecksAnnotationRecorder} from './annotation/recorders/ChecksAnnotationRecorder'
import {CommandAnnotationRecorder} from './annotation/recorders/CommandAnnotationRecorder'
import {AnnotationRecorder} from './annotation'
import {context as githubContext} from '@actions/github'
import {CompilerOutputListener} from './listeners/CompilerOutputListener'
import {BufferedStd} from './utils/BufferedStd'
import {DebugListener} from './listeners/DebugListener'
import {TestOutputListener} from './listeners/TestOutputListener'

class Input {
  readonly manifestPath: string
  readonly command: string
  readonly args: string[]
  readonly debug: boolean
  readonly token: string | null
  readonly toolchain: string

  constructor(
    manifestPath: string,
    command: string,
    args: string[],
    debug: boolean,
    token: string | null,
    toolchain: string
  ) {
    this.manifestPath = manifestPath
    this.command = command
    this.args = args
    this.debug = debug
    this.token = token
    this.toolchain = toolchain
  }

  /**
   * @throws Error
   */
  static parseFromEnv(): Input {
    const manifestPath = getInput('manifest-path')
    const command = getInput('command', {required: true})
    const rawArgs = getInput('args')
    const debug = getInput('debug') === 'true'
    const token: string | null = getInput('token') || null
    let toolchain = getInput('toolchain')
    if (toolchain) {
      if (toolchain.startsWith('+')) {
        toolchain = toolchain.slice(1)
      }
      toolchain = `+${toolchain}`
    }

    const args: string[] = []
    if (rawArgs) {
      for (const argToken of rawArgs.trim().split(/ +/g)) {
        const previousToken = args[args.length - 1]
        if (previousToken && previousToken.endsWith('\\')) {
          args[args.length - 1] = `${previousToken.slice(0, -1)} ${argToken}`
        } else {
          args.push(argToken)
        }
      }
    }

    return new Input(manifestPath, command, args, debug, token, toolchain)
  }
}

/**
 * @throws Error
 */
async function main(): Promise<void> {
  const input = Input.parseFromEnv()
  const project = new CargoProject(input.toolchain, input.manifestPath)
  const cargo = new Cargo(project)
  const bufferedStd = new BufferedStd()

  let headSHA = githubContext.sha
  if (githubContext.payload.pull_request?.head.sha) {
    headSHA = githubContext.payload.pull_request.head.sha
  }

  let recorder: AnnotationRecorder
  if (input.token) {
    recorder = new ChecksAnnotationRecorder(
      input.token,
      githubContext.repo.owner,
      githubContext.repo.repo,
      `cargo ${input.command}`,
      headSHA
    )
  } else {
    recorder = new CommandAnnotationRecorder()
  }

  let debugListener: DebugListener | undefined
  if (input.debug) {
    cargo.addListener(new DebugListener('raw-log.md'))
  }

  cargo.addListener(new CompilerOutputListener(recorder, project, bufferedStd))
  cargo.addListener(new TestOutputListener(recorder, project))

  try {
    const resultCode = await cargo.runCommand(input.command, input.args)

    if (resultCode > 0) {
      throw new Error(`Cargo exited with ${resultCode} code.`)
    }
  } finally {
    if (debugListener) {
      await debugListener.finalize()
    }

    setOutput('notice_count', recorder.noticeCount())
    setOutput('warning_count', recorder.warningCount())
    setOutput('failure_count', recorder.failureCount())

    await recorder.finalize()
  }
}

// eslint-disable-next-line github/no-then
main().catch(e => {
  setFailed(e.toString())
})
