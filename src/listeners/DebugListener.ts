// This file is part of the fibiol.com.
//
// (c) Andrey Savitsky <contact@qroc.pro>

import {CargoOutputListener} from '../CargoOutputListener'
import {
  Artifact,
  CompilerMessage,
  BuildScript,
  BuildFinished
} from '../metadata/messages'
import {promises as fs} from 'fs'

export class DebugListener implements CargoOutputListener {
  private readonly outputFile: string
  private buffer = ''

  constructor(outputFile: string) {
    this.outputFile = outputFile
  }

  artifact(record: Artifact): boolean {
    this.addToBuffer('artifact', record)

    return false
  }

  buildFinished(record: BuildFinished): boolean {
    this.addToBuffer('buildFinished', record)

    return false
  }

  buildScript(record: BuildScript): boolean {
    this.addToBuffer('buildScript', record)

    return false
  }

  compilerMessage(record: CompilerMessage): boolean {
    this.addToBuffer('compilerMessage', record)

    return false
  }

  textLine(record: string, isError: boolean): boolean {
    const title = isError ? 'error textLine' : 'default textLine'

    this.addToBuffer(title, record)

    return false
  }

  async finalize(): Promise<void> {
    await this.flushToFile(this.outputFile)
  }

  private async flushToFile(outputFile: string): Promise<void> {
    const buffer = this.buffer
    this.buffer = ''

    await fs.writeFile(outputFile, buffer)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private addToBuffer(title: string, data: any): void {
    this.buffer += `
${title}

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

    `
  }
}
