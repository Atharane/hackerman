import { RiArrowRightUpLine, RiBeerLine } from "@remixicon/react"
// import Banner from "data-base64:~assets/success.png"
import cssText from "data-text:~style.css"
import { motion } from "framer-motion"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useRef, useState } from "react"

import SquiglyProgressBar from "~features/squiglyProgressBar"
import { ACTIONS } from "~utils/constants"
import useOnClickOutside from "~utils/hooks/useOnClickOutside"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const Config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/*"]
}

type Config = {
  text_content: string
  problems_solved_today: number
  problems_scheduled_today: number
  recurrence_timestamp: Date
  next_problem: string
}

const CongratulationsModal = () => {
  const modalRef = useRef<HTMLDivElement>(null)
  const [modalVisible, setModalVisible] = useState(true)

  const [config, setConfig] = useState<Config>({
    text_content: "lorem ipsum dolor",
    problems_solved_today: 12,
    problems_scheduled_today: 72,
    recurrence_timestamp: new Date(),
    next_problem: ""
  })

  useOnClickOutside(modalRef, () => {
    // setShowModal(false)
  })

  useEffect(() => {
    const handleSubmission = (event: any) => {
      let { target } = event
      while (target) {
        target.matches('button[data-e2e-locator="console-submit-button"]') &&
          chrome.runtime.sendMessage({ action: "userClickedSubmit" })

        target = target.parentElement
      }
    }

    const messageInterceptor = (
      message: { action: string; data: Config },
      sender: chrome.runtime.MessageSender
      // sendResponse: (response: unknown) => void
    ) => {
      switch (message.action) {
        case ACTIONS.SUBMISSION_SUCCESSFUL:
          console.log(`🦄 ~ ${message.action}`)
          setModalVisible(true)
          setConfig(message.data)
          break
      }
    }

    document.addEventListener("click", handleSubmission) // submit button clicked
    chrome.runtime.onMessage.addListener(messageInterceptor)

    // 🧹 cleanup
    return () => {
      document.removeEventListener("click", handleSubmission)
      chrome.runtime.onMessage.removeListener(messageInterceptor)
    }
  }, [])

  if (!modalVisible) return null
  return (
    <motion.div
      initial={{
        opacity: 0
      }}
      animate={{
        opacity: 1,
        transition: {
          duration: 3,
          type: "spring"
        }
      }}
      transition={{
        type: "spring"
      }}>
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
                {config.text_content}
              </div>
            </div>
            <div className="absolute -right-6 bottom-16 flex rotate-12">
              <div className="w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800">
                <div className="w-fit rounded-2xl bg-[#5551FF] p-4 text-5xl font-bold text-white">
                  {config.problems_solved_today}
                </div>
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
            progress={config.problems_solved_today}
            total={config.problems_scheduled_today}
          />
          <div className="flex gap-2">
            <div className="w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800">
              <div className="w-fit rounded-2xl bg-slate-800 p-4 text-5xl font-bold text-white">
                11
                <span className="text-2xl">d</span>
              </div>
            </div>
            <div className="w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800">
              <div className="w-fit rounded-2xl shadow-inner bg-slate-800 p-4 text-5xl font-bold text-white">
                43
                <span className="text-2xl">h</span>
              </div>
            </div>
            <a
              href={config.next_problem}
              className="w-fit rounded-3xl bg-white p-2 shadow-2xl shadow-slate-800 cursor-pointer">
              <div className="w-fit rounded-2xl shadow-inner group bg-blue-600 p-4 text-5xl font-bold text-white">
                <RiArrowRightUpLine className="h-12 w-12 group-hover:rotate-12" />
              </div>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
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
