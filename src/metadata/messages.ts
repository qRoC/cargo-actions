// This file is part of the cargo-actions.
//
// Copyright (c) Andrii Savytskyi <contact@qroc.pro>
//
// For the full copyright and license information, please view
// the LICENSE file that was distributed with this source code.

import {Diagnostic} from './diagnostic'
import {PackageId, Target} from './base'

/// Profile settings used to determine which compiler flags to use for a target.
export interface ArtifactProfile {
  /// Optimization level.
  opt_level: '0' | '1' | '2' | '3' | 's' | 'z'

  /// The amount of debug info. 0 for none, 1 for limited, 2 for full.
  debuginfo: number | null

  /// State of the `cfg(debug_assertions)` directive, enabling macros like
  /// `debug_assert!`.
  debug_assertions: boolean

  /// State of the overflow checks.
  overflow_checks: boolean

  /// Whether this profile is a test.
  test: boolean
}

/// A compiler-generated file.
export interface Artifact {
  /// The package this artifact belongs to.
  package_id: PackageId

  /// The target this artifact was compiled for.
  target: Target

  /// The profile this artifact was compiled with.
  profile: ArtifactProfile

  /// The enabled features for this artifact.
  features: string[]

  /// The full paths to the generated artifacts (e.g. binary file and separate
  /// debug info).
  filenames: string[]

  /// Path to the executable file.
  executable: string | null

  /// If true, then the files were already generated.
  fresh: boolean
}

/// Message left by the compiler.
export interface CompilerMessage {
  /// The package this message belongs to.
  package_id: PackageId

  /// The target this message is aimed at.
  target: Target

  /// The message the compiler sent.
  message: Diagnostic
}

/// Output of a build script execution.
export interface BuildScript {
  /// The package this build script execution belongs to.
  package_id: PackageId

  /// The libs to link.
  linked_libs: string[]

  /// The paths to search when resolving libs.
  linked_paths: string[]

  /// Various `--cfg` flags to pass to the compiler.
  cfgs: string[]

  /// The environment variables to add to the compilation.
  env: [string, string][]

  /// The `OUT_DIR` environment variable where this script places its output.
  ///
  /// Added in Rust 1.41.
  out_dir: string | undefined
}

/// Final result of a build.
export interface BuildFinished {
  /// Whether or not the build finished successfully.
  success: boolean
}

/// A cargo message.
export enum MessageType {
  /// The compiler generated an artifact. See `Artifact`.
  CompilerArtifact,

  /// The compiler wants to display a message. See `CompilerMessage`.
  CompilerMessage,

  /// A build script successfully executed. See `BuildScript`.
  BuildScriptExecuted,

  /// The build has finished. See `BuildFinished`.
  ///
  /// This is emitted at the end of the build as the last message.
  /// Added in Rust 1.44.
  BuildFinished,

  /// A line of text which isn't a cargo or compiler message.
  ///
  /// Line separator is not included.
  TextLine
}

export function parseMessage(
  rawRecord: string
): [
  MessageType,
  Artifact | CompilerMessage | BuildScript | BuildFinished | string
] {
  let record = undefined
  try {
    record = JSON.parse(rawRecord)
  } catch (e) {
    /// is text line.
  }

  if (typeof record === 'object' && 'reason' in record) {
    switch (record['reason']) {
      case 'compiler-artifact':
        return [MessageType.CompilerArtifact, record as Artifact]
      case 'compiler-message':
        return [MessageType.CompilerMessage, record as CompilerMessage]
      case 'build-script-executed':
        return [MessageType.BuildScriptExecuted, record as BuildScript]
      case 'build-finished':
        return [MessageType.BuildFinished, record as BuildFinished]
    }
  }

  return [MessageType.TextLine, rawRecord]
}
