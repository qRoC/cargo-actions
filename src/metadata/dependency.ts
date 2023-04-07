// This file is part of the cargo-actions.
//
// Copyright (c) Andrii Savytskyi <contact@qroc.pro>
//
// For the full copyright and license information, please view
// the LICENSE file that was distributed with this source code.

export type DependencyKind =
  /// The 'normal' kind.
  | 'normal'
  /// Those used in tests only.
  | 'dev'
  /// Those used in build scripts only.
  | 'build'
  // Unknown kind.
  | 'other'

/// A dependency of the main crate.
export interface Dependency {
  /// Name as given in the `Cargo.toml`.
  name: string

  /// The source of dependency.
  source: string | null

  /// The required version.
  req: string

  /// The kind of dependency this is.
  kind: DependencyKind

  /// Whether this dependency is required or optional.
  optional: boolean

  /// Whether the default features in this dependency are used.
  uses_default_features: boolean

  /// The list of features enabled for this dependency.
  features: string[]

  /// The target this dependency is specific to.
  target: string | null

  /// If the dependency is renamed, this is the new name for the dependency
  /// as a string. `null` if it is not renamed.
  rename: string | null

  /// The URL of the index of the registry where this dependency is from.
  ///
  /// If `null`, the dependency is from crates.io.
  registry: string | null

  /// The file system path for a local path dependency.
  ///
  /// Only produced on cargo 1.51+
  path: string | null | undefined
}
