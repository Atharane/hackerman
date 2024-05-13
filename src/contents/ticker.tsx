import cssText from "data-text:~style.css"
import { motion } from "framer-motion"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect } from "react"

import { ACTIONS } from "~utils/constants"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const PopupTrigger = ({ toggleInteractive, initiateExtraction }) => {
  return (
    <div
      onClick={() => {
        initiateExtraction()
        toggleInteractive()
      }}>
      <div className="invisible group-hover:visible">
        {/* tooltip */}
        <motion.div
          className="absolute right-12 text-xs font-medium z-[999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}>
          <div className="font-bold relative bg-gray-800/60 text-slate-700 rounded-lg py-[10px] px-3 whitespace-nowrap">
            👀
          </div>
        </motion.div>
      </div>
      <div className="group-hover:pr-4 p-3 rounded-l-md pr-3 bg-slate-800/80">
        <div className="h-3 rounded-full w-3 bg-rose-500/60 animate-pulse"></div>
      </div>
    </div>
  )
}

const Overlay = ({ toggleInteractive }) => {
  return (
    <div className="mr-4 flex flex-col justify-center rounded-md border-2 bg-white p-6 w-96">
      <h1 className="font-dm-sans mb-6 text-center text-xl font-bold">
        <span>review</span>
        <span className="text-blue-500">gaurd</span>
        {/* adjust the quit button as needed... */}
        <button onClick={toggleInteractive} className="ml-12 text-rose-500">
          quit
        </button>
      </h1>
      <div className="flex items-center gap-4">
        <div className="h-32 w-32 rounded-full bg-rose-600"></div>
        <div className="">
          <div className="line-clamp-1">
            <span className="font-bold">Product: </span>
            <span className="text-slate-700">
              Nike Mens Flex Experience Rn 12Flex Experience Rn 12 Running Shoes
            </span>
          </div>
          <div>
            <span className="font-bold">Amzn Ratings</span>
            <span className="text-slate-700">doloir sit</span>
          </div>
          <div>
            <span className="font-bold">Reviewgaurd Rating</span>
            <span>i</span>
            <span className="text-slate-700">doloir sit</span>
          </div>
          <div>
            <span className="font-bold">Authenticity Ratio</span>
            <span>i</span>
            <span className="text-slate-700">doloir sit</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// https://www.tremor.so/docs/visualizations/donut-chart
// https://www.amazon.in/Sony-PS5-PlayStation-Console/dp/B0BRCP72X8/?_encoding=UTF8&pd_rd_w=KdT1E&content-id=amzn1.sym.4c78ee3f-a963-49e9-99df-1a54e5be0e41&pf_rd_p=4c78ee3f-a963-49e9-99df-1a54e5be0e41&pf_rd_r=4F2GT7SDTP5DSN6B081S&pd_rd_wg=ss03W&pd_rd_r=61df48b3-6f7b-4540-92d5-5e07e12d2ed2
const PlasmoOverlay = () => {
  const [interactive, setInteractive] = React.useState(true)
  const toggleInteractive = () => {
    setInteractive((previous) => !previous)
  }

  const initiateExtraction = async () => {
    const seeAllReviewsLink = document.querySelector(
      "a[data-hook='see-all-reviews-link-foot']"
    )
    const reviewsHref = `https://www.amazon.in${seeAllReviewsLink?.getAttribute(
      "href"
    )}` // https://www.amazon.in/Sony-PS5-PlayStation-Console/product-reviews/B0BRCP72X8/ref=cm_cr_dp_d_show_all_btm?ie=UTF8&reviewerType=all_reviews

    const response = await chrome.runtime.sendMessage({
      action: ACTIONS.OPEN_DASHBOARD,
      data: {
        url: reviewsHref
      }
    })
  }

  return (
    <button
      onClick={() => {
        setInteractive(true)
      }}
      className="z-50 group flex fixed right-0 top-16">
      {interactive ? (
        <Overlay toggleInteractive={toggleInteractive} />
      ) : (
        <PopupTrigger
          toggleInteractive={toggleInteractive}
          initiateExtraction={initiateExtraction}
        />
      )}
    </button>
  )
}

export default PlasmoOverlay
