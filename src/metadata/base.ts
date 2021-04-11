// This file is part of the fibiol.com.
//
// (c) Andrey Savitsky <contact@qroc.pro>

import {DependencyKind, Dependency} from './dependency'

/// The underlying string representation of package id.
export type PackageId = string

/// Starting point for metadata returned by `cargo metadata`.
export interface Metadata {
  /// A list of all crates referenced by this crate (and the crate itself).
  packages: Package[]

  /// A list of all workspace members.
  workspace_members: PackageId[]

  /// Dependencies graph.
  resolve: Resolve[]

  /// Workspace root.
  workspace_root: string

  /// Build directory.
  target_directory: string

  /// The workspace-level metadata object. Null if non-existent.
  metadata: object | undefined

  /// The metadata format version.
  version: number
}

/// A dependency graph.
export interface Resolve {
  /// Nodes in a dependencies graph.
  nodes: Node[]

  /// The crate for which the metadata was read.
  root: PackageId | null
}

/// A node in a dependencies graph.
export interface Node {
  /// An opaque identifier for a package.
  id: PackageId

  /// Dependencies in a structured format.
  ///
  /// `deps` handles renamed dependencies whereas `dependencies` does not.
  deps: NodeDep[]

  /// List of opaque identifiers for this node's dependencies.
  /// It doesn't support renamed dependencies. See `deps`.
  dependencies: PackageId[]

  /// Features enabled on the crate
  features: string[]
}

/// A dependency in a node.
export interface NodeDep {
  /// The name of the dependency's library target.
  /// If the crate was renamed, it is the new name.
  name: string

  /// Package ID (opaque unique identifier).
  pkg: PackageId

  /// The kinds of dependencies.
  ///
  /// This field was added in Rust 1.41.
  dep_kinds: DepKindInfo[] | undefined
}

/// Information about a dependency kind.
export interface DepKindInfo {
  /// The kind of dependency.
  kind: DependencyKind

  /// The target platform for the dependency.
  ///
  /// This is `null` if it is not a target dependency.
  target: string | null
}

/// One or more crates described by a single `Cargo.toml`.
///
/// Each [`target`][Package::targets] of a `Package` will be built as a crate.
/// For more information, see <https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html>.
export interface Package {
  /// Name as given in the `Cargo.toml`.
  name: string

  /// Version given in the `Cargo.toml`.
  version: string

  /// Authors given in the `Cargo.toml`.
  authors: string[]

  /// An opaque identifier for a package.
  id: PackageId

  /// The source of the package, e.g.
  /// crates.io or `null` for local projects.
  source: Source | null

  /// Description as given in the `Cargo.toml`.
  description: string | null

  /// List of dependencies of this particular package.
  dependencies: Dependency[]

  /// License as given in the `Cargo.toml`.
  license: string | null

  /// If the package is using a nonstandard license, this key may be specified
  // instead of `license`, and must point to a file relative to the manifest.
  license_file: string | null

  /// Targets provided by the crate (lib, bin, example, test, ...).
  targets: Target[]

  /// Features provided by the crate, mapped to the features required by that
  // feature.
  features: Record<string, string[]>

  /// Path containing the `Cargo.toml`.
  manifest_path: string

  /// Categories as given in the `Cargo.toml`.
  categories: string[]

  /// Keywords as given in the `Cargo.toml`.
  keywords: string[]

  /// Readme as given in the `Cargo.toml`.
  readme: string | null

  /// Repository as given in the `Cargo.toml`.
  repository: string | null

  /// Homepage as given in the `Cargo.toml`.
  ///
  /// On versions of cargo before 1.49, this will always be [`null`].
  homepage: string | null

  /// Documentation URL as given in the `Cargo.toml`.
  ///
  /// On versions of cargo before 1.49, this will always be [`null`].
  documentation: string | null

  /// Default Rust edition for the package.
  ///
  /// Beware that individual targets may specify their own edition in
  /// [`Target::edition`].
  edition: String

  /// Contents of the free form package.metadata section.
  metadata: object | undefined

  /// The name of a native library the package is linking to.
  links: string | null

  /// List of registries to which this package may be published.
  ///
  /// Publishing is unrestricted if `null`, and forbidden if the `Vec` is empty.
  ///
  /// This is always `null` if running with a version of Cargo older than 1.39.
  publish: string[] | null
}

/// The source of a package such as crates.io.
type Source = string

/// A single target (lib, bin, example, ...) provided by a crate.
export interface Target {
  /// Name as given in the `Cargo.toml` or generated from the file name.
  name: string

  /// Kind of target ("bin", "example", "test", "bench", "lib").
  kind: string[]

  /// Almost the same as `kind`, except when an example is a library instead of
  /// an executable. In that case `crate_types` contains things like `rlib` and
  /// `dylib` while `kind` is `example`.
  crate_types: string[]

  /// This target is built only if these features are enabled.
  /// It doesn't apply to `lib` targets.
  'required-features': string[]

  /// Path to the main source file of the target.
  src_path: string

  /// Rust edition for this target.
  edition: string

  /// Whether or not this target has doc tests enabled, and the target is
  /// compatible with doc testing.
  ///
  /// This is always `true` if running with a version of Cargo older than 1.37.
  doctest: boolean

  /// Whether or not this target is tested by default by `cargo test`.
  ///
  /// This is always `true` if running with a version of Cargo older than 1.47.
  test: boolean
}
