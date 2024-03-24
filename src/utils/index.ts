function decodeRequestBody(requestBody) {
  // Check if the request body is in raw format
  if (requestBody.raw) {
    let decodedData = ""
    requestBody.raw.forEach((part) => {
      // Assuming the body part is UTF-8 encoded
      let encodedStr = new TextDecoder("utf-8").decode(part.bytes)
      decodedData += encodedStr
    })

    try {
      // Try to parse the JSON if possible
      return JSON.parse(decodedData)
    } catch (e) {
      console.error("Error parsing JSON:", e)
      // Return raw data if it's not JSON
      return decodedData
    }
  }

  // Add more conditions here for other types like formData, file, etc.

  return null // Return null or some indication if the format is unrecognized or unsupported
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
