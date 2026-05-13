import { test, expect } from '@jest/globals'
import { ActRunner, ActExecStatus } from '@pshevche/act-test-runner'

test('hello world e2e', async () => {
  const result = await new ActRunner()
    .withWorkflowBody(
      `
name: hello-world
on: [push]

jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Hello, World!"
    `
    )
    .forwardOutput()
    .run()

  expect(result.status).toBe(ActExecStatus.SUCCESS)
  expect(result.output).toContain('Hello, World!')
}, 30000)
