// This file is part of the fibiol.com.
//
// (c) Andrey Savitsky <contact@qroc.pro>

import {AnnotationRecorder, Annotation, AnnotationLevel} from '../index'
import {getOctokit} from '@actions/github'
import {RequestError} from '@octokit/request-error'
import assert from 'assert'

type GithubChecksCompleteConclusion =
  | 'cancelled'
  | 'failure'
  | 'neutral'
  | 'success'
  | 'skipped'
  | 'timed_out'

class GithubChecksComplete {
  /// The time the check completed.
  readonly completedAt: Date

  /// The final conclusion of the check.
  readonly conclusion: GithubChecksCompleteConclusion

  constructor(conclusion: GithubChecksCompleteConclusion) {
    this.completedAt = new Date()
    this.conclusion = conclusion
  }
}

class GithubChecksOutput {
  /// The title of the check run.
  readonly title: string

  /// The summary of the check run. With Markdown supports.
  summary: string

  private textBlocks: string[]

  /// The details of the check run. With Markdown supports.
  get text(): string | undefined {
    if (!this.textBlocks.length) {
      return undefined
    }

    return `# Results\n\n${this.textBlocks.join('\n\n')}`
  }

  private annotations: Annotation[]

  constructor(title: string, summary: string) {
    this.title = title
    this.summary = summary
    this.textBlocks = []
    this.annotations = []
  }

  addAnnotation(annotation: Annotation): void {
    this.annotations.push(annotation)
  }

  popAnnotations(count: number): Annotation[] {
    return this.annotations.splice(0, count)
  }

  addInfoTable(
    section: string,
    title: string,
    value: string,
    rows: Record<string, string | number>
  ): void {
    const lines = [`## ${section}`, '', `| ${title} | ${value} |`, `|-|-|`]

    for (const [title, value] of Object.entries(rows)) {
      lines.push(`| ${title} | ${value} |`)
    }

    this.textBlocks.push(lines.join('\n'))
  }
}

type GithubChecksStatus = 'queued' | 'in_progress' | 'completed'

class GithubChecks {
  /// The name of the check.
  readonly name: string

  /// The SHA of the commit.
  readonly headSHA: string

  /// The current status.
  private statusMut: GithubChecksStatus

  get status(): GithubChecksStatus {
    return this.statusMut
  }

  /// The time that the check run began.
  readonly startedAt: Date

  private completedInfoMut: GithubChecksComplete | null

  get completedInfo(): GithubChecksComplete | null {
    return this.completedInfoMut
  }

  readonly output: GithubChecksOutput

  private readonly client: any
  private readonly owner: string
  private readonly repo: string
  private id?: number

  constructor(
    token: string,
    owner: string,
    repo: string,
    name: string,
    headSHA: string
  ) {
    this.name = name
    this.headSHA = headSHA
    this.statusMut = 'queued'
    this.startedAt = new Date()
    this.completedInfoMut = null
    this.output = new GithubChecksOutput(this.name, 'No summary provided')

    this.client = getOctokit(token)
    this.owner = owner
    this.repo = repo
    this.id = undefined
  }

  async finalize(completedInfo: GithubChecksComplete): Promise<void> {
    this.completedInfoMut = completedInfo

    await this.send()
  }

  /**
   * @throws RequestError
   * @private
   */
  private async send(): Promise<void> {
    if (this.status === 'completed') {
      throw new Error('Cannot send checks because they are already completed.')
    }

    this.statusMut = 'in_progress'

    const options: Record<string, any> = {
      owner: this.owner,
      repo: this.repo,
      check_run_id: this.id,

      name: this.name,
      head_sha: this.headSHA,
      status: this.status,
      started_at: this.startedAt.toISOString()
    }

    options.output = {
      title: this.output.title,
      summary: this.output.summary,
      text: this.output.text,
      annotations: this.popPreparedAnnotations(50)
    }

    if (this.id === undefined) {
      const response = await this.client.checks.create(options)
      assert(
        response.status === 201,
        'Response has bad status code, but RequestError not throws'
      )

      this.id = response.data.id
      options.check_run_id = this.id
    } else {
      const response = await this.client.checks.update(options)
      assert(
        response.status === 200,
        'Response has bad status code, but RequestError not throws'
      )
    }

    let annotations = this.popPreparedAnnotations(50)
    while (annotations.length > 0) {
      options.output.annotations = annotations

      const response = await this.client.checks.update(options)
      assert(
        response.status === 200,
        'Response has bad status code, but RequestError not throws'
      )

      annotations = this.popPreparedAnnotations(50)
    }

    if (this.completedInfo !== null) {
      this.statusMut = 'completed'

      options.status = this.status
      options.output.annotations = []
      options.conclusion = this.completedInfo.conclusion
      options.completed_at = this.completedInfo.completedAt.toISOString()

      const response = await this.client.checks.update(options)
      assert(
        response.status === 200,
        'Response has bad status code, but RequestError not throws'
      )
    }
  }

  private popPreparedAnnotations(count: number): Record<string, any>[] {
    return this.output.popAnnotations(count).map(annotation => {
      let title = annotation.title
      if (title && title.length > 255) {
        title = `${title.substring(0, 251)}...`
      }

      return {
        annotation_level: annotation.level,
        message: annotation.message,
        title,
        raw_details: annotation.rawDetails,
        path: annotation.block.file,
        start_line: annotation.block.startLine,
        end_line: annotation.block.endLine,
        start_column: annotation.block.startColumn,
        end_column: annotation.block.endColumn
      }
    })
  }
}

export class ChecksAnnotationRecorder implements AnnotationRecorder {
  private readonly githubChecks: GithubChecks
  private readonly stats: Record<AnnotationLevel, number>

  constructor(
    token: string,
    owner: string,
    repo: string,
    name: string,
    headSHA: string
  ) {
    this.githubChecks = new GithubChecks(token, owner, repo, name, headSHA)
    this.stats = {
      notice: 0,
      warning: 0,
      failure: 0
    }
  }

  noticeCount(): number {
    return this.stats.notice
  }

  warningCount(): number {
    return this.stats.warning
  }

  failureCount(): number {
    return this.stats.failure
  }

  addAnnotation(annotation: Annotation): void {
    this.githubChecks.output.addAnnotation(annotation)

    this.stats[annotation.level]++
  }

  addInfoTable(
    section: string,
    title: string,
    value: string,
    rows: Record<string, string | number>
  ): void {
    this.githubChecks.output.addInfoTable(section, title, value, rows)
  }

  async finalize(): Promise<void> {
    this.githubChecks.output.summary = `There are ${this.stats.failure} failures, ${this.stats.warning} warnings, and ${this.stats.notice} notice.`

    const conclusion = this.stats.failure > 0 ? 'failure' : 'success'

    await this.githubChecks.finalize(new GithubChecksComplete(conclusion))
  }
}
