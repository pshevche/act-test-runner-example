import { ActWorkflowExecResult, ActExecStatus } from '@pshevche/act-test-runner'

export function assertSuccess(result: ActWorkflowExecResult) {
  try {
    expect(result.status).toBe(ActExecStatus.SUCCESS)
  } catch (error) {
    throw new Error(
      `
Expected workflow status: SUCCESS.
Actual workflow status: ${ActExecStatus[result.status]}.
Output: 
${result.output}
      `,
      { cause: error }
    )
  }
}
