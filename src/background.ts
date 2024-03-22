const LEETCODE_URL = "https://leetcode.com"
const RULE_ID = 1
const isLeetCodeUrl = (url: string) => url.includes(LEETCODE_URL)

type schema = {
  upadtedAt: string
  operations: number
  records: [
    {
      uid: string
      operation: string
      createdAt: string
      updatedAt: string
      problems: [
        {
          id: string
          testcases: number
          submissions: [
            {
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
          ]
        }
      ]
    }
  ]
}

function decodeRequestBody(requestBody) {
  // Check if the request body is in raw format
  if (requestBody.raw) {
    let decodedData = ""
    requestBody.raw.forEach((part) => {
      // Assuming the body part is UTF-8 encoded
      let encodedStr = new TextDecoder("utf-8").decode(part.bytes)
      decodedData += encodedStr
    })

    try {
      // Try to parse the JSON if possible
      return JSON.parse(decodedData)
    } catch (e) {
      console.error("Error parsing JSON:", e)
      // Return raw data if it's not JSON
      return decodedData
    }
  }

  // Add more conditions here for other types like formData, file, etc.

  return null // Return null or some indication if the format is unrecognized or unsupported
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {},
  { urls: ["https://leetcode.com/*"] },
  ["requestBody"]
)

const isSubmissionSuccessURL = (url: string) =>
  url.includes("/submissions/detail/") && url.includes("/check/")

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

let store = {
  upadtedAt: new Date().toISOString(),
  operations: 0,
  records: [
    {
      uid: "atharane",
      operation: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      problems: []
    }
  ]
}

console.log("===== ~ store:", JSON.stringify(store, null, 2))

const checkIfUserSolvedProblem = async (details) => {
  // If the user has already solved the problem, then don't do anything
  //   if (await storage.getProblemSolved()) return
  // Get the current active tab's URL
  let currentURL = ""
  try {
    const [activeTab] = await new Promise<chrome.tabs.Tab[]>((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, resolve)
    })
    currentURL = activeTab.url
  } catch (error) {
    console.error("error getting active tab:", error)
    return
  }

  if (!isSubmissionSuccessURL(details.url)) return

  //   const problemUrl = await storage.getProblemUrl()

  //   const sameUrl =
  //     problemUrl === currentURL || problemUrl + "description/" === currentURL

  //   if (!sameUrl) {
  //     return
  //   }

  //lastCheckedUrl = details.url
  //lastCheckedTimestamp = now

  // if (state.solvedListenerActive) {
  //   // Remove the listener so that it doesn't fire again, since the outcome will either be success or fail
  //   // And we'll add it again when the user clicks submit
  //   state.solvedListenerActive = false
  //   chrome.webRequest.onCompleted.removeListener(checkIfUserSolvedProblem)
  // }

  console.log(`listening to ${details.url}`)
  try {
    // current url will be in the form of https://leetcode.com/problems/{{problemID}}/garbage/..., extract the problemID
    const problemID = currentURL.split("/")[4]

    //   const hyperTortureMode = await getHyperTortureMode()
    const response = await fetch(details.url)
    const data = await response.json()

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

    let problem = store.records[0].problems.find((p) => p.id === problemID)

    if (!problem) {
      problem = {
        id: problemID,
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

    store.operations += 1
    store.upadtedAt = new Date().toISOString()

    // keep problems with unique id
    const existingProblems = store.records[0].problems.filter(
      (p) => p.id !== problemID
    )

    store.records[0].problems = [...existingProblems, problem]

    console.log("===== ~ store:", JSON.stringify(store, null, 2))

    if (data.state === "STARTED" || data.state === "PENDING") {
      if (!state.solvedListenerActive) {
        state.solvedListenerActive = true
        chrome.webRequest.onCompleted.addListener(checkIfUserSolvedProblem, {
          urls: ["*://leetcode.com/submissions/detail/*/check/"]
        })
      }
      return
    }
    if (data.status_msg !== "Accepted") {
      // if (hyperTortureMode) {
      //   await resetHyperTortureStreak()
      sendUserFailedMessage()
      // }
      console.log("User failed the problem")
      return
    }
    if (
      data.status_msg === "Accepted" &&
      data.state === "SUCCESS" &&
      !data.code_answer
    ) {
      console.log("user solved the problem")
      // await storage.updateStreak()
      state.leetcodeProblemSolved = true
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [RULE_ID]
      })
      chrome.webRequest.onCompleted.removeListener(checkIfUserSolvedProblem)
      // if (hyperTortureMode) {
      //   if (state.lastAttemptedUrl) {
      //     chrome.tabs.update({ url: state.lastAttemptedUrl })
      //   }
      //   await updateStorage()
      // } else {
      sendUserSolvedMessage(data?.lang)
      // }
    }
  } catch (error) {
    console.error("Error:", error)
  }
}

chrome.webRequest.onCompleted.addListener(checkIfUserSolvedProblem, {
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
      chrome.webRequest.onCompleted.addListener(checkIfUserSolvedProblem, {
        urls: ["*://leetcode.com/submissions/detail/*/check/"]
      })
      break
    default:
      console.warn("Unknown message action:", message.action)
  }
}

// Need to add these listeners to global scope so that when the workers become inactive, they are set again
chrome.runtime.onMessage.addListener(onMessageReceived)
