import { test, expect, beforeAll, afterEach, afterAll } from '@jest/globals'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { ActRunner, ActExecStatus } from '@pshevche/act-test-runner'

interface CreateCommentRequest {
  body: string
  issue_number: number
}

const capturedRequests: CreateCommentRequest[] = []

const server = setupServer(
  http.post(
    'http://localhost:8585/repos/:owner/:repo/issues/:issueNumber/comments',
    async ({ params, request }) => {
      const body = (await request.json()) as { body: string }
      capturedRequests.push({
        body: body.body,
        issue_number: Number(params.issueNumber)
      })
      return HttpResponse.json({ id: Date.now() }, { status: 201 })
    }
  )
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
})

afterEach(() => {
  capturedRequests.length = 0
})

afterAll(() => {
  server.close()
})

function createPayload(
  commentBody: string,
  issueNumber: number,
  isPR: boolean
): string {
  const issue: Record<string, unknown> = { number: issueNumber }
  if (isPR) {
    issue.pull_request = {}
  }
  return JSON.stringify({
    action: 'created',
    issue,
    comment: { body: commentBody }
  })
}

function buildRunner(payloadFile: string): ActRunner {
  return new ActRunner()
    .withWorkflowBody(`
name: echo-comment-test
on:
  issue_comment:
    types: [created]

jobs:
  echo-comment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: ./
        with:
          github-token: fake-token
`)
    .withEvent('issue_comment', payloadFile)
    .withEnvValues(['GITHUB_API_URL', 'http://localhost:8585'])
    .withAdditionalArgs('--network', 'host')
    .forwardOutput()
}

test(
  'echoes a comment on an issue',
  async () => {
    const tmpDir = mkdtempSync('payload-')
    const payloadFile = join(tmpDir, 'payload.json')
    writeFileSync(payloadFile, createPayload('Test comment', 42, false))

    const result = await buildRunner(payloadFile).run()

    rmSync(tmpDir, { recursive: true, force: true })

    expect(result.status).toBe(ActExecStatus.SUCCESS)
    expect(capturedRequests).toHaveLength(1)
    expect(capturedRequests[0]).toEqual({
      body: '[ECHO > ISSUE] Test comment',
      issue_number: 42
    })
  },
  120000
)

test(
  'echoes a comment on a pull request',
  async () => {
    const tmpDir = mkdtempSync('payload-')
    const payloadFile = join(tmpDir, 'payload.json')
    writeFileSync(payloadFile, createPayload('PR comment', 7, true))

    const result = await buildRunner(payloadFile).run()

    rmSync(tmpDir, { recursive: true, force: true })

    expect(result.status).toBe(ActExecStatus.SUCCESS)
    expect(capturedRequests).toHaveLength(1)
    expect(capturedRequests[0]).toEqual({
      body: '[ECHO > PR] PR comment',
      issue_number: 7
    })
  },
  120000
)
