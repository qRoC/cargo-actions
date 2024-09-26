// This file is part of the cargo-actions.
//
// Copyright (c) Andrii Savytskyi <contact@qroc.pro>
//
// For the full copyright and license information, please view
// the LICENSE file that was distributed with this source code.

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
