# act-test-runner-example

An example GitHub Action demonstrating how
[act-test-runner](https://github.com/pshevche/act-test-runner) can be used to
implement end-to-end tests for GitHub Actions.

This repository is based on the
[actions/typescript-action](https://github.com/actions/typescript-action)
template.

## The Action

The action echoes comments posted on an issue or PR. When triggered by an
`issue_comment` event, it posts a reply with the original comment prefixed by
`[ECHO > ISSUE]` (for issue comments) or `[ECHO > PR]` (for PR comments).

### Inputs

| Name           | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `github-token` | Yes      | GitHub token for API authentication |

### Example workflow

```yaml
on:
  issue_comment:
    types: [created]

jobs:
  echo:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pshevche/act-test-runner-example@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Project structure

```
├── __e2e__/                    # End-to-end tests (run via act)
│   └── smoke.test.ts
├── __fixtures__/
│   ├── resources/              # Test resource files
│   │   ├── workflow.yml
│   │   ├── issue-payload.json
│   │   └── pr-payload.json
│   ├── core.ts                 # @actions/core mock
│   ├── github_mock_server.ts   # Express mock server for GitHub API
│   └── resources.ts            # Resource path helper
├── __tests__/                   # Unit tests
│   └── main.test.ts
├── src/
│   ├── main.ts                  # Action entry point
│   └── index.ts                 # Bootstrap
└── action.yml
```

## Prerequisites

- [Node.js](https://nodejs.org/) 24+
- [Docker](https://docker.com) — required for e2e tests (act needs Docker
  containers)
- [act](https://nektosact.com) — optional, installed automatically on CI

## Scripts

| Command                | Description                                  |
| ---------------------- | -------------------------------------------- |
| `npm run test:unit`    | Unit tests with Jest                         |
| `npm run test:e2e`     | End-to-end tests with act-test-runner        |
| `npm run lint`         | ESLint                                       |
| `npm run format:write` | Prettier                                     |
| `npm run format:check` | Prettier check                               |
| `npm run package`      | Bundle with Rollup                           |
| `npm run all`          | Format, lint, unit tests, e2e tests, package |

## Testing

### Unit tests

Unit tests mock `@actions/core` and `@actions/github` to verify the action
logic:

```bash
npm run test:unit
```

### End-to-end tests

E2e tests use [act-test-runner](https://github.com/pshevche/act-test-runner) to
run the action locally via `act` in Docker containers. A mock Express server
stands in for the GitHub API so requests can be inspected:

```bash
npm run test:e2e
```

The CI workflow runs linter + unit tests first, and only if those pass, runs the
e2e tests.
