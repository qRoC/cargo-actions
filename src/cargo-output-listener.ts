// This file is part of the cargo-actions.
//
// Copyright (c) Andrii Savytskyi <contact@qroc.pro>
//
// For the full copyright and license information, please view
// the LICENSE file that was distributed with this source code.

import {
  Artifact,
  CompilerMessage,
  BuildScript,
  BuildFinished
} from './metadata/messages'

export interface CargoOutputListener {
  artifact(record: Artifact): boolean

  compilerMessage(record: CompilerMessage): boolean

  buildScript(record: BuildScript): boolean

  buildFinished(record: BuildFinished): boolean

  textLine(record: string, isError: boolean): boolean

  finalize(): Promise<void>
}

export class CargoOutputListeners implements CargoOutputListener {
  private listeners: CargoOutputListener[] = []

  addListener(listener: CargoOutputListener): void {
    this.listeners.push(listener)
  }

  artifact(record: Artifact): boolean {
    for (const listener of this.listeners) {
      const stopIterate = listener.artifact(record)
      if (stopIterate) {
        return true
      }
    }

    return false
  }

  compilerMessage(record: CompilerMessage): boolean {
    for (const listener of this.listeners) {
      const stopIterate = listener.compilerMessage(record)
      if (stopIterate) {
        return true
      }
    }

    return false
  }

  buildScript(record: BuildScript): boolean {
    for (const listener of this.listeners) {
      const stopIterate = listener.buildScript(record)
      if (stopIterate) {
        return true
      }
    }

    return false
  }

  buildFinished(record: BuildFinished): boolean {
    for (const listener of this.listeners) {
      const stopIterate = listener.buildFinished(record)
      if (stopIterate) {
        return true
      }
    }

    return false
  }

  textLine(record: string, isError: boolean): boolean {
    for (const listener of this.listeners) {
      const stopIterate = listener.textLine(record, isError)
      if (stopIterate) {
        return true
      }
    }

    return false
  }

  async finalize(): Promise<void> {
    for (const listener of this.listeners) {
      await listener.finalize()
    }
  }
}
