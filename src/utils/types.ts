export type Submissions = {
  id: string
  timestamp: string
  status: string
  runtime: number
  memory: number
  language: string
  passed_testcases: number
  runtime_percentile: number
  memory_percentile: number
}

export type Problems = Record<
  string,
  {
    id: string
    testcases: number
    sucessful_submissions: number
    last_successful_submission_at: string
    scheduled_at: string
    submissions: Array<Submissions>
  }
>

export type Profile = {
  uid: string
  operation: number
  createdAt: string
  updatedAt: string
  problems: Problems
}
