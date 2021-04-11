// This file is part of the fibiol.com.
//
// (c) Andrey Savitsky <contact@qroc.pro>

export type AnnotationLevel = 'notice' | 'warning' | 'failure'

export class AnnotationBlock {
  /// The path of the file to add an annotation to.
  readonly file: string

  /// The start line of the annotation.
  readonly startLine: number

  /// The end line of the annotation.
  readonly endLine: number

  /// The start column of the annotation.
  readonly startColumn?: number

  /// The end column of the annotation.
  readonly endColumn?: number

  private constructor(
    file: string,
    startLine: number,
    endLine: number,
    startColumn?: number,
    endColumn?: number
  ) {
    this.file = file
    this.startLine = startLine
    this.endLine = endLine
    this.startColumn = startColumn
    this.endColumn = endColumn
  }

  static create(
    file: string,
    startLine: number,
    endLine?: number,
    startColumn?: number,
    endColumn?: number
  ): AnnotationBlock {
    if (startLine !== (endLine ?? startLine)) {
      return AnnotationBlock.createByFileBlock(file, startLine, endLine)
    }

    return AnnotationBlock.createByLineBlock(
      file,
      startLine,
      startColumn,
      endColumn
    )
  }

  static createByFileBlock(
    file: string,
    startLine: number,
    endLine?: number
  ): AnnotationBlock {
    return new AnnotationBlock(file, startLine, endLine ?? startLine)
  }

  static createByLineBlock(
    file: string,
    line: number,
    startColumn?: number,
    endColumn?: number
  ): AnnotationBlock {
    return new AnnotationBlock(
      file,
      line,
      line,
      startColumn,
      endColumn ?? startColumn
    )
  }
}

export class Annotation {
  /// The level of the annotation.
  readonly level: AnnotationLevel

  /// Annotation block.
  readonly block: AnnotationBlock

  /// A short description of the feedback for these lines of code.
  readonly message: string

  /// The title that represents the annotation. The maximum size is 255 characters.
  readonly title?: string

  /// Details about this annotation.
  readonly rawDetails?: string

  constructor(
    level: AnnotationLevel,
    block: AnnotationBlock,
    message: string,
    title?: string,
    rawDetails?: string
  ) {
    this.level = level
    this.block = block
    this.message = message
    this.title = title
    this.rawDetails = rawDetails
  }
}

export interface AnnotationRecorder {
  addAnnotation(annotation: Annotation): void

  addInfoTable(
    section: string,
    title: string,
    value: string,
    rows: Record<string, string | number>
  ): void

  finalize(): Promise<void>

  noticeCount(): number

  warningCount(): number

  failureCount(): number
}
