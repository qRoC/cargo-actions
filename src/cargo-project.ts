// This file is part of the cargo-actions.
//
// Copyright (c) Andrii Savytskyi <contact@qroc.pro>
//
// For the full copyright and license information, please view
// the LICENSE file that was distributed with this source code.

export class CargoProject {
  readonly manifestPath: string
  readonly toolchain: string

  constructor(toolchain: string, manifestPath: string) {
    this.toolchain = toolchain
    this.manifestPath = manifestPath
  }

  getFullPath(path: string): string {
    return this.manifestPath === '' ? path : `${this.manifestPath}/${path}`
  }
}
