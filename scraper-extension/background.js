// background.js
const GROQ_API_KEY = "ENTER_YOUR_API_KEY";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

chrome.runtime.onInstalled.addListener(() => {
  console.log("DataPull active.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "askAI") {
    callGroq(request.query, request.pageContent)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function callGroq(userQuery, pageContent) {
  const smartItems = pageContent.smartItems || [];
  const smartText = pageContent.smartText || "";
  const bodyText = pageContent.bodyText || "";

  // Limit smart text to 50 items max
  const smartTextLimited = smartText.split("\n").slice(0, 50).join("\n");

  // Use smart text if available, else body text
  const content = smartItems.length > 0 && smartTextLimited.length > 0
    ? smartTextLimited
    : bodyText.slice(0, 3000);

  // Dynamic max_tokens based on item count
  const itemCount = smartItems.length;
  const maxTokens = itemCount > 100 ? 3000
                  : itemCount > 50  ? 2000
                  : itemCount > 20  ? 1500
                  : 1000;

  const prompt = `Extract: "${userQuery}"
Page: ${pageContent.title}

DATA:
${content}

Reply ONLY with JSON, no extra text:
{
  "columns": ["Column1","Column2"],
  "rows": [["val1","val2"]],
  "summary": "what was found"
}

Rules:
- JSON only, no backticks
- Extract ALL items found
- If nothing found: {"columns":["Result"],"rows":[["No data found"]],"summary":"nothing"}`;

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || "Groq API error");
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content || "";
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Try rephrasing your query.");
  }
}