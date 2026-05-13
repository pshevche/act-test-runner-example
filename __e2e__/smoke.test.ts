import { test, expect, beforeAll, afterEach, afterAll } from '@jest/globals'
import express from 'express'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { ActRunner, ActExecStatus } from '@pshevche/act-test-runner'

interface CreateCommentRequest {
  body: string
  issue_number: number
}

const capturedRequests: CreateCommentRequest[] = []
let mockServerPort: number
let server: Server

const isLinux = process.platform === 'linux'

beforeAll(async () => {
  const app = express()

  app.use(express.json())

  app.post('/repos/:owner/:repo/issues/:issueNumber/comments', (req, res) => {
    capturedRequests.push({
      body: req.body.body,
      issue_number: Number(req.params.issueNumber)
    })
    res.status(201).json({ id: Date.now() })
  })

  await new Promise<void>((resolve) => {
    server = app.listen(0, '0.0.0.0', () => {
      mockServerPort = (server.address() as AddressInfo).port
      resolve()
    })
  })
}, 30000)

afterAll(() => {
  server.close()
})

afterEach(() => {
  capturedRequests.length = 0
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
  const hostname = isLinux ? 'localhost' : 'host.docker.internal'
  const apiUrl = `http://${hostname}:${mockServerPort}`

  const runner = new ActRunner()
    .withWorkflowBody(
      `
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
`
    )
    .withEvent('issue_comment', payloadFile)
    .withEnvValues(['GITHUB_API_URL', apiUrl])
    .forwardOutput()

  if (isLinux) {
    runner.withAdditionalArgs('--network', 'host')
  }

  return runner
}

test('echoes a comment on an issue', async () => {
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
}, 120000)

test('echoes a comment on a pull request', async () => {
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
}, 120000)
