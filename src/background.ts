import { redis } from "~models/database"
import { sleep } from "~utils"
import type { Profile } from "~utils/types"

const uid = "atharane"

const broadcastToContentScript = (payload) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, payload)
  })
}

const getCurrentURL = async () => {
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

const pastSubmissions = new Set()
const evaluateSubmissionStatus = async (details) => {
  const currentURL = await getCurrentURL()
  const isRequestTypeSubmission =
    details.url.includes("/submissions/detail/") &&
    details.url.includes("/check/")

  if (!isRequestTypeSubmission) return

  try {
    const submissionId = details.url.split("/")[5]

    if (pastSubmissions.has(submissionId)) return
    pastSubmissions.add(submissionId)

    const problem_id = currentURL.split("/")[4]
    const response = await fetch(details.url)
    let data = await response.json()

    let loopLimit = 20

    while (data.state === "PENDING") {
      sleep(1000)
      const response = await fetch(details.url)
      data = await response.json()
      loopLimit -= 1
      if (loopLimit === 0) {
        break
      }
    }

    const submission = {
      id: data.submission_id,
      timestamp: new Date().toISOString(),
      status: data.status_msg,
      runtime: parseInt(data.status_runtime) || null,
      memory: parseInt(data.memory) || null,
      language: data.lang,
      passed_testcases: data.total_correct,
      runtime_percentile: data.runtime_percentile,
      memory_percentile: data.memory_percentile
    }

    if (!submission.id) return
    console.log("~ submission", JSON.stringify(submission, null, 2))

    const submisssion_sucessful = data.status_msg === "Accepted"

    const user = ((await redis.get(uid)) || {}) as Profile
    const problems = user?.problems || {}
    let problem = problems[problem_id]

    const scheduled_at = new Date()
    scheduled_at.setDate(scheduled_at.getDate() + 1)
    scheduled_at.setHours(8, 0, 0, 0)

    if (!problem) {
      problem = {
        id: problem_id,
        testcases: data.total_testcases,
        sucessful_submissions: submisssion_sucessful ? 1 : 0,
        scheduled_at: submisssion_sucessful ? scheduled_at.toISOString() : null,
        submissions: [submission]
      }
    } else {
      problem.sucessful_submissions =
        (problem.sucessful_submissions ?? 0) + (submisssion_sucessful ? 1 : 0)

      if (submisssion_sucessful) {
        if (problem.sucessful_submissions === 1) {
          problem.scheduled_at = scheduled_at.toISOString()
        }
        if (problem.sucessful_submissions === 2) {
          // schedule between 2-7 days from now at a random time
          const random_days = Math.floor(Math.random() * 5) + 2
          const random_hours = Math.floor(Math.random() * 24)
          scheduled_at.setDate(scheduled_at.getDate() + random_days)
          scheduled_at.setHours(random_hours, 0, 0, 0)
          problem.scheduled_at = scheduled_at.toISOString()
        }
        if (problem.sucessful_submissions === 3) {
          // schedule between 14-31 days from now at a random time
          const random_days = Math.floor(Math.random() * 17) + 14
          const random_hours = Math.floor(Math.random() * 24)
          scheduled_at.setDate(scheduled_at.getDate() + random_days)
          scheduled_at.setHours(random_hours, 0, 0, 0)
          problem.scheduled_at = scheduled_at.toISOString()
        }
        if (problem.sucessful_submissions > 3) {
          // distant date in the future
          scheduled_at.setDate(scheduled_at.getDate() + 100 * 365)
          scheduled_at.setHours(0, 0, 0, 0)
          problem.scheduled_at = scheduled_at.toISOString()
        }
      }
      problem.submissions.push(submission)
    }

    problems[problem_id] = problem
    user.problems = problems
    user.operation += 1
    user.updatedAt = new Date().toISOString()
    user.createdAt = user.createdAt || user.updatedAt

    await redis.set(uid, user)

    const new_data = await redis.get(uid)
    console.log("new_data", new_data)

    // if (data.state === "STARTED" || data.state === "PENDING") {
    //   if (!state.solvedListenerActive) {
    //     state.solvedListenerActive = true
    //     chrome.webRequest.onCompleted.addListener(checkIfUserSolvedProblem, {
    //       urls: ["*://leetcode.com/submissions/detail/*/check/"]
    //     })
    //   }
    // }
    // if (data.status_msg !== "Accepted") {
    //   sendUserFailedMessage()

    // if (
    //   data.status_msg === "Accepted" &&
    // ) {
    //   state.leetcodeProblemSolved = true
    //   // chrome.declarativeNetRequest.updateDynamicRules({
    //   //   removeRuleIds: [RULE_ID]
    //   // })
    //   chrome.webRequest.onCompleted.removeListener(checkIfUserSolvedProblem)
    //   sendUserSolvedMessage(data?.lang)
  } catch (error) {
    console.error("ERROR ~ unable to fetch submission status", error)
  }
}

chrome.webRequest.onCompleted.addListener(evaluateSubmissionStatus, {
  urls: ["https://leetcode.com/*"]
})

const onMessageReceived = (message, sender, sendResponse) => {
    if (message.action === "openDeltaPage") {
    console.log("Opening delta page.")
    chrome.tabs.create({url: "tabs/delta.html"});
  }
  switch (message.action) {
    case "fetchingProblem":
      // Handle the start of the problem fetch.
      console.log("Fetching problem started.")
      break
    case "problemFetched":
      // Handle the end of the problem fetch.
      console.log("Fetching problem completed.")
      break
    case "getProblemStatus":
      sendResponse({
        status: "error/not-implemented",
        data: {}
      })
      return true
    case "userClickedSubmit":
      chrome.webRequest.onCompleted.addListener(evaluateSubmissionStatus, {
        urls: ["*://leetcode.com/submissions/detail/*/check/"]
      })
      break
    default:
      console.warn("Unknown message action:", message.action)
  }
}

// Need to add these listeners to global scope so that when the workers become inactive, they are set again
chrome.runtime.onMessage.addListener(onMessageReceived)
