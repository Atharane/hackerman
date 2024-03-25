import { RiArrowRightUpLine, RiBeerLine } from "@remixicon/react"
import { M, r } from "@upstash/redis/zmscore-07021e27"
// import Banner from "data-base64:~assets/success.png"
import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useRef, useState } from "react"

import { ACTIONS } from "~utils/constants"
import useOnClickOutside from "~utils/hooks/useOnClickOutside"

import SquiglyProgressBar from "../features/squiglyProgressBar"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/*"]
}

const CongratulationsModal = ({
  text_content,
  problems_solved_today,
  problems_scheduled_today,
  recurrence_timestamp,
  next_problem
}: {
  text_content: string
  problems_solved_today: number
  problems_scheduled_today: number
  recurrence_timestamp: Date
  next_problem: string
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const [modalVisible, setModalVisible] = useState(false)

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
        currentTarget = currentTarget.parentElement
      }
    }
    const messageInterceptor = (
      message: { action: string },
      sender: chrome.runtime.MessageSender
      // sendResponse: (response: unknown) => void
    ) => {
      console.log(`🦄 ~ message`, message)
      if (message.action === ACTIONS.SUBMISSION_SUCCESSFUL) {
        console.log(`🦄 ~ ${message.action}`)
        setModalVisible(true)
      }
    }

    document.addEventListener("click", handleClick)
    // chrome.runtime.onMessage.addListener(messageInterceptor)

    chrome.runtime.onMessage.addListener(
      function (message, sender, sendResponse) {
        if (message.message === "myMessage") {
          alert(
            "I got a message from the background script: " + message.message
          )
        }
      }
    )

    return () => {
      document.removeEventListener("click", handleClick)
      chrome.runtime.onMessage.removeListener(messageInterceptor)
    }
  }, [])

  useOnClickOutside(modalRef, () => {
    // setShowModal(false)
  })

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`🦄 ~ message`, message)
    if (message.action === "userClickedSubmit") {
      console.log("🚨 ~ submission_unsuccessful")
    }
  })

  if (!modalVisible) return null
  return (
    <div
      ref={modalRef}
      className="space-y-2 -rotate-2 p-2 border-dashed border-2 backdrop-blur-sm border-white/20 rounded-[2rem] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div className="flex gap-1">
        <div className="relative">
          <div className="w-fit rounded-3xl bg-white p-2">
            <div className="w-fit rounded-2xl bg-[#176A3A] px-6 py-4 pr-10 text-5xl font-bold text-white">
              <span>
                <RiBeerLine className="text-slate-100/50 h-10 w-10 inline-block mr-1 relative bottom-1" />
              </span>
              {text_content}
            </div>
          </div>
          <div className="absolute -right-6 bottom-16 flex rotate-12">
            <div className="w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800">
              <div className="w-fit rounded-2xl bg-[#5551FF] p-4 text-5xl font-bold text-white"></div>
            </div>
          </div>
        </div>
        <button className="group ml-1 w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800">
          <div className="flex w-fit rounded-2xl shadow-inner shadow-red-800 bg-[#f31551] p-4 text-5xl font-bold text-white">
            <span>break</span>
            <div className="group-hover:-rotate-12">;</div>
          </div>
        </button>
      </div>
      <div className="gap-2 flex items-center">
        <SquiglyProgressBar
          className="mx-auto"
          progress={problems_solved_today}
          total={problems_scheduled_today}
        />
        <div className="flex gap-2">
          <div className="w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800">
            <div className="w-fit rounded-2xl bg-slate-800 p-4 text-5xl font-bold text-white">
              {Math.floor(
                (recurrence_timestamp.getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )}
              <span className="text-2xl">d</span>
            </div>
          </div>
          <div className="w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800">
            <div className="w-fit rounded-2xl shadow-inner bg-slate-800 p-4 text-5xl font-bold text-white">
              {Math.floor(
                (recurrence_timestamp.getTime() - Date.now()) / (1000 * 60 * 60)
              ) % 24}
              <span className="text-2xl">h</span>
            </div>
          </div>
          <a className="w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800 cursor-pointer">
            <div className="w-fit rounded-2xl shadow-inner group bg-blue-600 p-4 text-5xl font-bold text-white">
              <RiArrowRightUpLine className="h-12 w-12 group-hover:rotate-12" />
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}

export default CongratulationsModal

{
  /* <img
src={Banner}
style={{
  width: "20%",
  height: "fit-content"
}}
alt="success"
/> */
}
