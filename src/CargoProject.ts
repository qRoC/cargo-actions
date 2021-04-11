// This file is part of the fibiol.com.
//
// (c) Andrey Savitsky <contact@qroc.pro>

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
