import { test, expect, beforeAll, afterEach, afterAll } from '@jest/globals'
import express from 'express'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ActRunner, ActExecStatus } from '@pshevche/act-test-runner'

const __dirname = dirname(fileURLToPath(import.meta.url))

const workflowFile = resolve(__dirname, 'workflow.yml')
const issuePayload = resolve(__dirname, 'issue-payload.json')
const prPayload = resolve(__dirname, 'pr-payload.json')

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

function buildRunner(payloadFile: string): ActRunner {
  const hostname = isLinux ? 'localhost' : 'host.docker.internal'
  const apiUrl = `http://${hostname}:${mockServerPort}`

  const runner = new ActRunner()
    .withWorkflowFile(workflowFile)
    .withEvent('issue_comment', payloadFile)
    .withEnvValues(['GITHUB_API_URL', apiUrl])
    .forwardOutput()

  if (isLinux) {
    runner.withAdditionalArgs('--network', 'host')
  }

  return runner
}

test('echoes a comment on an issue', async () => {
  const result = await buildRunner(issuePayload).run()

  expect(result.status).toBe(ActExecStatus.SUCCESS)
  expect(capturedRequests).toHaveLength(1)
  expect(capturedRequests[0]).toEqual({
    body: '[ECHO > ISSUE] Test comment',
    issue_number: 42
  })
}, 120000)

test('echoes a comment on a pull request', async () => {
  const result = await buildRunner(prPayload).run()

  expect(result.status).toBe(ActExecStatus.SUCCESS)
  expect(capturedRequests).toHaveLength(1)
  expect(capturedRequests[0]).toEqual({
    body: '[ECHO > PR] PR comment',
    issue_number: 7
  })
}, 120000)
