import { motion } from "framer-motion"
import React from "react"

type TooltipProps = {
  tooltipClassName?: string
  tooltipContentsClassName?: string
  tooltipPointerClassName?: string
  text: string
}

export default function Tooltip(props: TooltipProps) {
  const {
    tooltipClassName = "absolute -bottom-10 left-2/4 -translate-x-2/4 text-xs font-medium z-[999]",
    text,
    tooltipPointerClassName = "absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-100 dark:bg-gray-800 transform rotate-45 -z-10"
  } = props

  if (!text) return null
  return (
    <motion.div
      className={tooltipClassName}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}>
      <div
        className={`${props.tooltipContentsClassName} font-bold relative bg-gray-100 text-slate-700 rounded-lg py-1.5 px-2 whitespace-nowrap`}>
        {text}
      </div>
      <div className={tooltipPointerClassName} />
    </motion.div>
  )
}
