import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)

const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    core.getInput.mockImplementation(() => 'fake-token')
    github.getOctokit.mockImplementation(() => ({
      rest: { issues: { createComment: jest.fn() } }
    }))
    github.context.payload.comment.body = 'Hello, world!'
    github.context.payload.issue.number = 42
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Posts an echoed comment on an issue', async () => {
    await run()

    const octokit = github.getOctokit.mock.results[0].value
    expect(octokit.rest.issues.createComment).toHaveBeenNthCalledWith(1, {
      owner: 'owner',
      repo: 'repo',
      issue_number: 42,
      body: '[ECHO > ISSUE] Hello, world!'
    })
    expect(core.info).toHaveBeenCalledWith('Echoed comment on ISSUE #42')
  })

  it('Posts an echoed comment on a pull request', async () => {
    github.context.payload.issue.pull_request = {}

    await run()

    const octokit = github.getOctokit.mock.results[0].value
    expect(octokit.rest.issues.createComment).toHaveBeenNthCalledWith(1, {
      owner: 'owner',
      repo: 'repo',
      issue_number: 42,
      body: '[ECHO > PR] Hello, world!'
    })
    expect(core.info).toHaveBeenCalledWith('Echoed comment on PR #42')
  })

  it('Warns if no comment body is present', async () => {
    github.context.payload.comment.body = undefined

    await run()

    expect(core.warning).toHaveBeenNthCalledWith(
      1,
      'No comment body found in the event payload'
    )
  })

  it('Warns if no issue number is present', async () => {
    github.context.payload.issue.number = undefined

    await run()

    expect(core.warning).toHaveBeenNthCalledWith(
      1,
      'No issue or PR number found in the event payload'
    )
  })

  it('Sets a failed status on error', async () => {
    core.getInput.mockImplementationOnce(() => {
      throw new Error('Input required and not supplied: github-token')
    })

    await run()

    expect(core.setFailed).toHaveBeenNthCalledWith(
      1,
      'Input required and not supplied: github-token'
    )
  })
})
