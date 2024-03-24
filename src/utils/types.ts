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
  createdAt: string
  updatedAt: string
  problems: Record<
    string,
    {
      id: string
      testcases: number
      sucessful_submissions: number
      scheduled_at: string
      submissions: Array<Submissions>
    }
  >
}
