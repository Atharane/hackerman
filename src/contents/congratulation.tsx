import { RiArrowRightUpLine, RiBeerLine } from "@remixicon/react"
// import Banner from "data-base64:~assets/success.png"
import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useState } from "react"

import SquiglyProgressBar from "../features/squiglyProgressBar"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/*"]
}

const CongratulationsModal = () => {
  const [showModal, setShowModal] = useState(true)
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
      message: { action: string; language: string },
      sender: chrome.runtime.MessageSender
      // sendResponse: any
    ) => {
      if (message.action === "userSolvedProblem") {
        console.log("🦄 ~ submission_successful")
        setShowModal(true)
      }
    }

    document.addEventListener("click", handleClick)

    chrome.runtime.onMessage.addListener(messageInterceptor)

    return () => {
      document.removeEventListener("click", handleClick)
      chrome.runtime.onMessage.removeListener(messageInterceptor)
    }
  }, [])

  if (!showModal) return null
  return (
    <div className="space-y-2 -rotate-2 p-2 border-dashed border-2 backdrop-blur-sm border-white/20 rounded-[2rem] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div className="flex gap-1">
        <div className="relative">
          <div className="w-fit rounded-3xl bg-white p-2">
            <div className="w-fit rounded-2xl bg-[#176A3A] px-6 py-4 pr-10 text-5xl font-bold text-white">
              <span className="">
                <RiBeerLine className="text-slate-100/50 h-10 w-10 inline-block mr-1 relative bottom-1" />
              </span>
              Let's fucking go!
            </div>
          </div>
          <div className="absolute -right-6 bottom-16 flex rotate-12">
            <div className="w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800">
              <div className="w-fit rounded-2xl bg-[#5551FF] p-4 text-5xl font-bold text-white">
                12
              </div>
            </div>
          </div>
        </div>
        <div className="ml-1 w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800">
          <div className="w-fit rounded-2xl shadow-inner shadow-red-800 bg-[#f31551] p-4 text-5xl font-bold text-white">
            break;
          </div>
        </div>
      </div>

      <div className="gap-2 flex items-center">
        <SquiglyProgressBar className="mx-auto" percentage={40} />
        <div className="flex gap-2">
          <div className="w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800">
            <div className="w-fit rounded-2xl bg-slate-800 p-4 text-5xl font-bold text-white">
              12
              <span className="text-2xl">d</span>
            </div>
          </div>
          <div className="w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800">
            <div className="w-fit rounded-2xl shadow-inner bg-slate-800 p-4 text-5xl font-bold text-white">
              13<span className="text-2xl">h</span>
            </div>
          </div>
          <div className="w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800">
            <div className="w-fit rounded-2xl shadow-inner bg-blue-600 p-4 text-5xl font-bold text-white">
              <RiArrowRightUpLine className="h-12 w-12 hover:rotate-6" />
            </div>
          </div>
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
