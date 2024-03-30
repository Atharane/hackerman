import _ from "lodash"

import { redis } from "~models/database"
import { sleep } from "~utils"
import { ACTIONS } from "~utils/constants"
import type { Problems, Profile } from "~utils/types"

const uid = "atharane"

const broadcastToContentScript = (payload) => {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, payload)
    })
  } catch (error) {
    console.error("ERROR ~ unable to broadcast to content script", error)
  }
}

const getActiveTabUrl = async () => {
  try {
    const [activeTab] = await new Promise<chrome.tabs.Tab[]>((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, resolve)
    })
    return activeTab.url
  } catch (error) {
    console.error("ERROR ~ unable to fetch current url", error)
    return null
  }
}

const fetchSubmissionStatus = async (url) => {
  const RETRY_COUNT = 20
  for (let i = 0; i < RETRY_COUNT; i++) {
    await sleep(1000)
    const response = await fetch(url)
    const data = await response.json()
    if (data.status_code) return data
  }
  return null
}

const updateUserRecords = async (uid, problem_id, submission) => {
  const user = (await redis.get(uid)) as Profile
  const problems = user?.problems || {}
  const submisssion_sucessful = submission.status === "Accepted"
  let problem = problems?.[problem_id]

  const now = new Date()
  const scheduled_at = new Date()

  if (!problem) {
    // schedule for tomorrow 8'oclock
    scheduled_at.setDate(now.getDate() + 1)
    scheduled_at.setHours(8, 0, 0, 0)

    problem = {
      id: problem_id,
      testcases: submission.total_testcases,
      sucessful_submissions: submisssion_sucessful ? 1 : 0,
      scheduled_at: submisssion_sucessful ? scheduled_at.toISOString() : null,
      last_successful_submission_at: submisssion_sucessful
        ? now.toISOString()
        : null,
      submissions: [] // push later...
    }
  } else {
    if (!submisssion_sucessful) return

    switch (problem.sucessful_submissions) {
      case 2:
        // anywhere between 2-7 days from now at 8'oclock
        const delta_days = Math.floor(Math.random() * 5) + 2
        scheduled_at.setDate(now.getDate() + delta_days)
        scheduled_at.setHours(8, 0, 0, 0)
        break
      case 3:
        // anywhere between 14-31 days from now at 8'oclock
        const random_days = Math.floor(Math.random() * 17) + 14
        scheduled_at.setDate(now.getDate() + random_days)
        scheduled_at.setHours(8, 0, 0, 0)
        break
      default:
        scheduled_at.setDate(now.getDate() + 100 * 365)
        scheduled_at.setHours(0, 0, 0, 0)
        break
    }

    problem.sucessful_submissions += 1
    problem.scheduled_at = scheduled_at.toISOString()
    problem.last_successful_submission_at = new Date().toISOString()
  }

  problem.submissions.push(submission)
  problems[problem_id] = problem
  user.problems = problems
  user.operation = (user.operation ?? 0) + 1
  user.updatedAt = new Date().toISOString()
  user.createdAt = user.createdAt || user.updatedAt

  await redis.set(uid, user)
  return user
}

const broadcastSubmissionSuccess = (problem_id: string, problems: Problems) => {
  const problems_scheduled_today = Object.values(problems).filter(
    (problem) =>
      new Date(problem?.scheduled_at)?.getDate() === new Date().getDate()
  ).length

  const problems_solved_today = Object.values(problems).filter(
    (problem) =>
      new Date(problem?.last_successful_submission_at).getDate() ===
      new Date().getDate()
  ).length

  const problem = problems[problem_id]
  const recurrence_timestamp = problem?.scheduled_at

  const next_problem = Object.values(problems).find((problem) => {
    // new Date(problem.scheduled_at).getDate() === new Date().getDate()
    new Date(problem.scheduled_at).getDate() >= new Date().getDate() &&
      new Date(problem.scheduled_at).getDate() <= new Date().getDate() + 7
  })

  broadcastToContentScript({
    action: ACTIONS.SUBMISSION_SUCCESSFUL,
    data: {
      text_content: "Let's fucking go!",
      problems_solved_today,
      problems_scheduled_today,
      recurrence_timestamp,
      next_problem
    }
  })
}

const pastSubmissions = new Set()
const evaluateSubmissionStatus = async (details) => {
  const activeTabUrl = await getActiveTabUrl()

  const isRequestTypeSubmission =
    details.url.includes("/submissions/detail/") &&
    details.url.includes("/check/")

  if (!isRequestTypeSubmission) return

  const submissionId = details.url.split("/")[5]
  if (pastSubmissions.has(submissionId)) return

  try {
    pastSubmissions.add(submissionId)

    const problem_id = activeTabUrl.split("/")[4]
    const submission_response = await fetchSubmissionStatus(details.url)

    if (!submission_response)
      throw new Error(`ERROR ~ failed to fetch status ${details.url}`)

    const submission = {
      id: submission_response.submission,
      timestamp: new Date().toISOString(),
      status: submission_response.status_msg,
      runtime: parseInt(submission_response.status_runtime) || null,
      memory: parseInt(submission_response.memory) || null,
      language: submission_response.lang,
      passed_testcases: submission_response.total_correct,
      runtime_percentile: submission_response.runtime_percentile,
      memory_percentile: submission_response.memory_percentile
    }
    console.log("~ submission: ", submission)

    const user = await updateUserRecords(uid, problem_id, submission)
    console.log("~ revised: ", user)

    broadcastSubmissionSuccess(problem_id, user.problems)
  } catch (error) {
    console.error("ERROR ~ unable to fetch submission status", error)
  }
}

const getProblems = async () => {
  // get problems in form "name, id, scheduled_at, successful_submissions"
  const user = (await redis.get(uid)) as Profile
  // return only the data needed nothing else
  const problems = _.mapValues(user.problems, (problem) => {
    return _.pick(problem, ["id", "scheduled_at", "sucessful_submissions"])
  })

  // convert to array
  return Object.values(problems)
}

const messageInterceptor = (
  message: { action: string; data?: unknown },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
) => {
  switch (message.action) {
    case ACTIONS.FETCH_DASHBOARD_DATA:
      const data = getProblems().then((problems) => {
        console.log("~ problems: ", problems)
        return { action: ACTIONS.DASHBOARD_DATA, data: problems }
      })
      break
    case ACTIONS.OPEN_DASHBOARD:
      chrome.tabs.create({ url: "tabs/dashboard.html" })
      break
    case ACTIONS.USER_CLICKED_SUBMIT:
      console.log("user clicked submit observed in background script!!")
      chrome.webRequest.onCompleted.addListener(evaluateSubmissionStatus, {
        urls: ["*://leetcode.com/submissions/detail/*/check/"]
      })
      break
    default:
      console.warn("unknown message received ", message.action)
  }
}

chrome.runtime.onMessage.addListener(messageInterceptor)

// const response = await chrome.runtime.sendMessage({ greeting: "hello" })
// console.log(response)
