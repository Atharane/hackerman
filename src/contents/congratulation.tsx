import styleText from "data-text:./modal.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useState } from "react"

import { messages } from "~utils/constants"

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/*"]
}
export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

const CongratulationsModal = () => {
  const [showModal, setShowModal] = useState(false)
  const [language, setLanguage] = useState("")
  useEffect(() => {
    const handleClick = (event: any) => {
      let currentTarget = event.target
      while (currentTarget) {
        if (
          currentTarget.matches(
            'button[data-e2e-locator="console-submit-button"]'
          )
        ) {
          console.log("✨ user fucking clicked submit...")
          chrome.runtime.sendMessage({ action: "userClickedSubmit" })
        }
        // We hit a child element, so we go up the DOM until we're at the button
        currentTarget = currentTarget.parentElement
      }
    }
    const messageInterceptor = (
      message: { action: string; language: string },
      sender: chrome.runtime.MessageSender,
      sendResponse: any
    ) => {
      if (message.action === "userSolvedProblem") {
        console.log("🦄 ~ submission_successful")
        setShowModal(true)
        setLanguage(message.language)
      }
    }

    document.addEventListener("click", handleClick)

    chrome.runtime.onMessage.addListener(messageInterceptor)

    return () => {
      document.removeEventListener("click", handleClick)
      chrome.runtime.onMessage.removeListener(messageInterceptor)
    }
  }, [])

  return (
    showModal && (
      <div className="modal-background">
        <div className="modal-content">
          <h1>Congratulations! You've solved the problem!</h1>
          <h3>{messages[language]?.message}</h3>
          <button
            className="close-modal-button"
            onClick={() => setShowModal(false)}>
            Close
          </button>
        </div>
      </div>
    )
  )
}

export default CongratulationsModal
