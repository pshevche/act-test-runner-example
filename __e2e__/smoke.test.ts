import { test, expect, beforeAll, afterEach, afterAll } from '@jest/globals'
import { ActRunner, ActExecStatus } from '@pshevche/act-test-runner'
import { resourcePath } from '../__fixtures__/resources'
import { RequestCapturingGithubServer } from '../__fixtures__/github_mock_server'

const mockServer = new RequestCapturingGithubServer()

beforeAll(async () => {
  await mockServer.start()
}, 30000)

afterAll(() => {
  mockServer.stop()
})

afterEach(() => {
  mockServer.reset()
})

function actRunner(eventPayloadFileName: string): ActRunner {
  const apiUrl = `http://host.docker.internal:${mockServer.getPort()}`
  const workflowFile = resourcePath('resources/workflow.yml')
  const eventPayloadFile = resourcePath(`resources/${eventPayloadFileName}`)

  return new ActRunner()
    .withWorkflowFile(workflowFile)
    .withEvent('issue_comment', eventPayloadFile)
    .withInputsValues(['github-token', 'fake-token'])
    .withEnvValues(['GITHUB_API_URL', apiUrl])
    .forwardOutput()
}

test('echoes a comment on an issue', async () => {
  const result = await actRunner('issue-payload.json').run()

  expect(result.status).toBe(ActExecStatus.SUCCESS)
  expect(mockServer.getRequests()).toHaveLength(1)
  expect(mockServer.getRequests()[0]).toEqual({
    body: '[ECHO > ISSUE] Test comment',
    issue_number: 42
  })
}, 120000)

test('echoes a comment on a pull request', async () => {
  const result = await actRunner('pr-payload.json').run()

  expect(result.status).toBe(ActExecStatus.SUCCESS)
  expect(mockServer.getRequests()).toHaveLength(1)
  expect(mockServer.getRequests()[0]).toEqual({
    body: '[ECHO > PR] PR comment',
    issue_number: 7
  })
}, 120000)
