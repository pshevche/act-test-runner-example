import express from 'express'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'

interface CreateCommentRequest {
  body: string
  issue_number: number
}

export class RequestCapturingGithubServer {
  private serverPort: number | undefined
  private server: Server | undefined
  private capturedRequests: CreateCommentRequest[] = []

  async start() {
    const app = express()

    app.use(express.json())

    app.post('/repos/:owner/:repo/issues/:issueNumber/comments', (req, res) => {
      this.capturedRequests.push({
        body: req.body.body,
        issue_number: Number(req.params.issueNumber)
      })
      res.status(201).json({ id: Date.now() })
    })

    await new Promise<void>((resolve) => {
      this.server = app.listen(0, '0.0.0.0', () => {
        this.serverPort = (this.server!.address() as AddressInfo).port
        resolve()
      })
    })
  }

  reset() {
    this.capturedRequests = []
  }

  stop() {
    if (this.server) {
      this.server.close()
      this.server = undefined
      this.serverPort = undefined
    }
  }

  getPort(): number {
    return this.serverPort!
  }

  getRequests(): CreateCommentRequest[] {
    return this.capturedRequests
  }
}
