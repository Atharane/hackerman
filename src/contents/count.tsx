import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://*/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

// if (!window.location.href.startsWith("https://leetcode")) {
//   window.location.href = "https://leetcode.com/studyplan/leetcode-75"
// }

chrome.runtime.sendMessage({ action: "openDeltaPage" })

const PlasmoOverlay = () => {
  return <div className="z-50 flex fixed top-32 right-8">*</div>
}

export default PlasmoOverlay
