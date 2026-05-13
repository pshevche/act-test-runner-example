import { jest } from '@jest/globals'

export const context = {
  payload: {
    comment: {
      body: undefined as string | undefined
    },
    issue: {
      number: undefined as number | undefined,
      pull_request: undefined as object | undefined
    }
  },
  repo: {
    owner: 'owner',
    repo: 'repo'
  }
}

export const getOctokit = jest.fn(() => ({
  rest: {
    issues: {
      createComment: jest.fn()
    }
  }
}))
