const LEETCODE_URL = "https://leetcode.com"
const RULE_ID = 1
const isLeetCodeUrl = (url: string) => url.includes(LEETCODE_URL)

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
  (details) => {
    console.log("submitting Request URL: ", details.url)
  },
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

const checkIfUserSolvedProblem = async (details) => {
  // If the user has already solved the problem, then don't do anything
  //   if (await storage.getProblemSolved()) return

//   let currentURL = ""
//   try {
//     const [activeTab] = await new Promise<chrome.tabs.Tab[]>((resolve) => {
//       chrome.tabs.query({ active: true, currentWindow: true }, resolve)
//     })
//     currentURL = activeTab.url
//   } catch (error) {
//     console.error("error getting active tab:", error)
//     return
//   }

  //   const problemUrl = await storage.getProblemUrl()

  //   const sameUrl =
  //     problemUrl === currentURL || problemUrl + "description/" === currentURL

  //   if (!sameUrl) {
  //     return
  //   }

  //lastCheckedUrl = details.url
  //lastCheckedTimestamp = now

  if (state.solvedListenerActive) {
    // Remove the listener so that it doesn't fire again, since the outcome will either be success or fail
    // And we'll add it again when the user clicks submit
    state.solvedListenerActive = false
    chrome.webRequest.onCompleted.removeListener(checkIfUserSolvedProblem)
  }

  if (isSubmissionSuccessURL(details.url)) {
    try {
      //   const hyperTortureMode = await getHyperTortureMode()
      const response = await fetch(details.url)
      const data = await response.json()
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
      chrome.webRequest.onCompleted.addListener(checkIfUserSolvedProblem, {
        urls: ["*://leetcode.com/submissions/detail/*/check/"]
      })
      break
    default:
      console.warn("unknown message action:", message.action)
  }
}

// Need to add these listeners to global scope so that when the workers become inactive, they are set again
chrome.runtime.onMessage.addListener(onMessageReceived)
