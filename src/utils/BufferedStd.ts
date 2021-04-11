// This file is part of the fibiol.com.
//
// (c) Andrey Savitsky <contact@qroc.pro>

import {info} from '@actions/core'

export class BufferedStd {
  private buffer = ''
  private isError?: boolean = undefined

  write(record: string, isError: boolean): void {
    if (this.isError !== undefined && this.isError !== isError) {
      this.flush()
    }

    this.isError = isError
    this.buffer += record
  }

  writeLine(record: string, isError: boolean): void {
    this.write(`${record}\n`, isError)
  }

  flush(): void {
    if (this.isError) {
      info(`\u001b[1m\u001b[38;2;255;0;0m${this.buffer}`)
    } else {
      info(`\u001b[35m${this.buffer}`)
    }

    this.buffer = ''
    this.isError = undefined
  }
}
