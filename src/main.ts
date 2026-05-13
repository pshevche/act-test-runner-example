import * as core from '@actions/core'
import * as github from '@actions/github'

export async function run(): Promise<void> {
  try {
    const token = core.getInput('github-token', { required: true })
    const octokit = github.getOctokit(token)

    const commentBody = github.context.payload.comment?.body

    if (!commentBody) {
      core.warning('No comment body found in the event payload')
      return
    }

    const issue = github.context.payload.issue

    if (!issue?.number) {
      core.warning('No issue or PR number found in the event payload')
      return
    }

    const prefix = issue.pull_request ? 'PR' : 'ISSUE'

    await octokit.rest.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: issue.number,
      body: `[ECHO > ${prefix}] ${commentBody}`
    })

    core.info(`Echoed comment on ${prefix} #${issue.number}`)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}
