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

export type Profile = {
  uid: string
  operation: number
  // purple 12, submissions where date is today
  // tooltip x, submissions where scheduled_at is today
  // blue redirect, first submission, scheduled_at is today
  // black timestamp: current problem, scheduled_at
  // break, scheduled_at to infinity
  createdAt: string
  updatedAt: string
  problems: Record<
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
}
