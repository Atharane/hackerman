import { useEffect, useState } from "react"

import "~/style.css"

function Dashboard() {
  const [metadata, setMetadata] = useState(null)

  useEffect(() => {
    {
      async function fetchDashboardData() {
        const message = { action: "fetch_dashboard_data" }
        const response = await chrome.runtime.sendMessage(message)
        setMetadata(response.data)
      }
      fetchDashboardData()
    }
  }, [])

  return <main className="h-screen flex p-4 flex-col gap-4 font-dm-sans"></main>
}

export default Dashboard
