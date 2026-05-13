import { ActWorkflowExecResult, ActExecStatus } from '@pshevche/act-test-runner'

export function assertSuccess(result: ActWorkflowExecResult) {
  try {
    expect(result.status).toBe(ActExecStatus.SUCCESS)
  } catch (error) {
    throw new Error(
      `Expected workflow to succeed, but got ${result.status}. Output: ${result.output}`,
      { cause: error }
    )
  }
}
