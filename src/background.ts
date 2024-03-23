import { store } from "~models/database"

const LEETCODE_URL = "https://leetcode.com"
const RULE_ID = 1
const isLeetCodeUrl = (url: string) => url.includes(LEETCODE_URL)
const uid = "atharane"

const sendUserSolvedMessage = (languageUsed: string) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "userSolvedProblem",
      language: languageUsed
    })
  })
}

const sendUserFailedMessage = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "userFailedProblem"
    })
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

const state = {
  leetcodeProblemSolved: false,
  leetCodeProblem: {
    url: null,
    name: null
  },
  lastSubmissionDate: new Date(0),
  solvedListenerActive: false,
  lastAttemptedUrl: null,
  urlListener: null
}

console.log("===== ~ store ", JSON.stringify(store, null, 2))

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

    const problemId = currentURL.split("/")[4]
    const response = await fetch(details.url)
    let data = await response.json()

    let loopLimit = 20

    while (data.state === "PENDING") {
      await new Promise((resolve) => setTimeout(resolve, 5000))
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


    let problem = store.records[uid].problems[problemId]

    if (!problem) {
      problem = {
        id: problemId,
        testcases: data.total_testcases,
        submissions: [submission]
      }
    } else {
      // keep submissions with unique id
      const existingSubmission = problem.submissions.find(
        (s) => s.id === submission.id
      )
      if (!existingSubmission) {
        problem.submissions.push(submission)
      }
    }

    store.records[uid].problems[problemId] = problem
    store.operations += 1
    store.upadtedAt = new Date().toISOString()

    console.log("~ store:", JSON.stringify(store, null, 2))

    // if (data.state === "STARTED" || data.state === "PENDING") {
    //   if (!state.solvedListenerActive) {
    //     state.solvedListenerActive = true
    //     chrome.webRequest.onCompleted.addListener(checkIfUserSolvedProblem, {
    //       urls: ["*://leetcode.com/submissions/detail/*/check/"]
    //     })
    //   }
    //   return
    // }
    // if (data.status_msg !== "Accepted") {
    //   // if (hyperTortureMode) {
    //   //   await resetHyperTortureStreak()
    //   sendUserFailedMessage()
    //   // }
    //   console.log("User failed the problem")
    //   return
    // }
    // if (
    //   data.status_msg === "Accepted" &&
    //   data.state === "SUCCESS" &&
    //   !data.code_answer
    // ) {
    //   console.log("user solved the problem")
    //   // await storage.updateStreak()
    //   state.leetcodeProblemSolved = true
    //   // chrome.declarativeNetRequest.updateDynamicRules({
    //   //   removeRuleIds: [RULE_ID]
    //   // })
    //   chrome.webRequest.onCompleted.removeListener(checkIfUserSolvedProblem)
    //   // if (hyperTortureMode) {
    //   //   if (state.lastAttemptedUrl) {
    //   //     chrome.tabs.update({ url: state.lastAttemptedUrl })
    //   //   }
    //   //   await updateStorage()
    //   // } else {
    //   sendUserSolvedMessage(data?.lang)
    //   // }
    // }

    // return
  } catch (error) {
    console.error("ERROR ~ unable to fetch submission status", error)
  }
}

chrome.webRequest.onCompleted.addListener(evaluateSubmissionStatus, {
  urls: ["https://leetcode.com/*"]
})

const onMessageReceived = (message, sender, sendResponse) => {
  switch (message.action) {
    case "fetchingProblem":
      // Handle the start of the problem fetch.
      // Currently, we'll just log it for clarity, but you can add other logic here if needed.
      console.log("Fetching problem started.")
      break
    case "problemFetched":
      // Handle the end of the problem fetch.
      console.log("Fetching problem completed.")
      break
    case "getProblemStatus":
      sendResponse({
        problemSolved: state.leetcodeProblemSolved,
        problem: state.leetCodeProblem
      })
      return true
    case "userClickedSubmit":
      state.lastSubmissionDate = new Date()
      state.solvedListenerActive = true
      console.log(
        "User clicked submit, adding listener",
        state.solvedListenerActive
      )
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
