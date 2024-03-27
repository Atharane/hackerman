import cssText from "data-text:~style.css"
import { motion } from "framer-motion"
import type { PlasmoCSConfig } from "plasmo"
import React from "react"

export const config: PlasmoCSConfig = {
  matches: ["https://*.leetcode.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

function Tooltip({ text }) {
  return (
    <motion.div
      className="absolute right-12 text-xs font-medium z-[999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}>
      <div className="font-bold relative bg-gray-100/60 text-slate-700 rounded-lg py-1.5 px-2 whitespace-nowrap">
        {text}
      </div>
    </motion.div>
  )
}

const PlasmoOverlay = () => {
  return (
    <div className="z-50 group flex fixed top-16 right-2">
      <div className="invisible group-hover:visible">
        <Tooltip text="we spying on your fun" />
      </div>
      <div className="group-hover:pr-4 p-2 rounded-l-md pr-3 bg-white/10">
        <div className="h-3 rounded-full w-3 bg-rose-500/60 animate-pulse"></div>
      </div>
    </div>
  )
}

export default PlasmoOverlay
