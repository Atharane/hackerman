import styleText from "data-text:./modal.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect } from "react"

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

const FailedModal = () => {
  useEffect(() => {
    const handleClick = (event: any) => {
      let currentTarget = event.target
      while (currentTarget) {
        if (
          currentTarget.matches(
            'button[data-e2e-locator="console-submit-button"]'
          )
        ) {
          chrome.runtime.sendMessage({ action: "userClickedSubmit" })
        }
        // We hit a child element, so we go up the DOM until we're at the button
        currentTarget = currentTarget.parentElement
      }
    }

    const messageInterceptor = (
      message: { action: string },
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: unknown) => void
    ) => {
      if (message.action === "userFailedProblem")
        console.log("🚨 ~ submission_unsuccessful")
    }

    document.addEventListener("click", handleClick)

    // Listen for messages from the background script or other parts of the extension.
    chrome.runtime.onMessage.addListener(messageInterceptor)

    return () => {
      document.removeEventListener("click", handleClick)
      chrome.runtime.onMessage.removeListener(messageInterceptor)
    }
  }, [])

  // return <></>
}

export default FailedModal
