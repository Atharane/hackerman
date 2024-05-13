import * as cheerio from "cheerio"
import _ from "lodash"

import { ACTIONS } from "~utils/constants"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

const messageInterceptor = async (
  message: { action: string; data?: Record<string, unknown> },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
) => {
  switch (message.action) {
    // case ACTIONS.FETCH_DASHBOARD_DATA:
    //   sendResponse({ action: ACTIONS.DASHBOARD_DATA, data: {}})
    //   break

    case ACTIONS.OPEN_DASHBOARD:
      try {
        const url = message.data?.url as string
        console.log("~ url:", url)

        const webpageResponse = await fetch(url)
        const html = await webpageResponse.text()
        const $ = cheerio.load(html)

        const h1 = $("h1").first().text()

        // get all data-hook="review-title" elements
        const reviewTitles = $("[data-hook='review-title']")
          .map((index, element) => $(element).text())
          .get()

        console.log("~ reviewTitles:", JSON.stringify(reviewTitles, null, 2))

        //  feed the data to ml model
        const modelResponse = await fetch("http://localhost:8080", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            reviews: [
              {
                title: "",
                description: "",
                rating: "",
                date: ""
              }
            ]
          })
        })
        const data = await modelResponse.json()

        // send the data to content script, aka the popup
        await chrome.runtime.sendMessage({
          status: true,
          message: data?.message,
          data: data?.data
        })

        // chrome.tabs.create({ url: "tabs/dashboard.html" }) // spawn a new tab, if needed
        break
      } catch (err) {
        console.log(`ERROR/EXTRACTING_REVIEWS:${err}`)
        // send error message to content script, aka the popup
        await chrome.runtime.sendMessage({
          status: false,
          message: err.message
        })
      }

    default:
      console.warn("unknown message received ", message.action)
  }
}

chrome.runtime.onMessage.addListener(messageInterceptor)

// const response = await chrome.runtime.sendMessage({ greeting: "hello" })
// console.log(response)
