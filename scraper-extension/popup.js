// popup.js
let scrapedData = null;

document.addEventListener("DOMContentLoaded", () => {
  loadCurrentTabInfo();
  setupQuickPrompts();
  setupScrapeButton();
  setupExportButtons();
});

async function loadCurrentTabInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const urlEl = document.getElementById("currentUrl");
    const statusEl = document.getElementById("pageStatus");
    if (tab?.url) {
      const url = new URL(tab.url);
      urlEl.textContent = url.hostname + url.pathname.slice(0, 30);
      statusEl.textContent = "READY";
    } else {
      urlEl.textContent = "No page detected";
      statusEl.textContent = "ERROR";
    }
  } catch (err) {
    document.getElementById("currentUrl").textContent = "Unable to read tab";
  }
}

function setupQuickPrompts() {
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.getElementById("userQuery").value = chip.dataset.prompt;
      document.getElementById("userQuery").focus();
    });
  });
}

function setupScrapeButton() {
  document.getElementById("scrapeBtn").addEventListener("click", async () => {
    const query = document.getElementById("userQuery").value.trim();
    if (!query) {
      showStatus("error", "❌ Please describe what you want to extract.");
      return;
    }
    await runScrape(query);
  });
}

async function runScrape(query) {
  const btn = document.getElementById("scrapeBtn");
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span> Reading Page...';
  showStatus("loading", "Reading page content...");
  hideResults();
  hideRaw();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab found.");

    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { action: "getPageContent" });
    } catch (e) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content_script.js"]
      });
      response = await chrome.tabs.sendMessage(tab.id, { action: "getPageContent" });
    }

    if (!response?.success) throw new Error(response?.error || "Failed to read page.");

    const pageData = response.data;
    showRawPreview(pageData);

    showStatus("loading", "🤖 AI is analysing the page...");
    btn.innerHTML = '<span class="btn-icon">🤖</span> AI Thinking...';

    const aiResponse = await chrome.runtime.sendMessage({
      action: "askAI",
      query: query,
      pageContent: pageData
    });

    if (!aiResponse?.success) throw new Error(aiResponse?.error || "AI failed to process.");

    const aiData = aiResponse.data;
    renderTable(aiData.columns, aiData.rows);
    scrapedData = aiData;
    showStatus("success", `✅ ${aiData.summary || "Data extracted successfully."}`);

  } catch (err) {
    showStatus("error", "❌ " + (err.message || "Something went wrong."));
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">⚡</span> Read This Page';
  }
}

function showRawPreview(data) {
  const rawSection = document.getElementById("rawSection");
  const rawPreview = document.getElementById("rawPreview");
  const preview = [
    `📄 Title: ${data.title}`,
    `🔗 URL: ${data.url}`,
    `📝 Meta: ${data.metaDesc || "—"}`,
    ``,
    `📌 Headings found: ${data.headings?.length || 0}`,
    ...(data.headings || []).slice(0, 5).map(h => `  ${h.tag}: ${h.text}`),
    ``,
    `🛒 Smart items found: ${data.smartItems?.length || 0}`,
    ...(data.smartItems || []).slice(0, 3).map(i => `  ${i.name} | ${i.price}`),
    ``,
    `🔗 Links found: ${data.links?.length || 0}`,
    ...(data.links || []).slice(0, 3).map(l => `  ${l.text} → ${l.href.slice(0, 40)}...`),
  ].join("\n");
  rawPreview.textContent = preview;
  rawSection.classList.add("visible");
}

function renderTable(columns, rows) {
  const thead = document.getElementById("tableHead");
  const tbody = document.getElementById("tableBody");
  const countEl = document.getElementById("resultsCount");

  thead.innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join("")}</tr>`;
  tbody.innerHTML = rows.map(row =>
    `<tr>${(Array.isArray(row) ? row : [row]).map(cell =>
      `<td title="${cell}">${cell || "—"}</td>`
    ).join("")}</tr>`
  ).join("");

  countEl.textContent = `${rows.length} item${rows.length !== 1 ? "s" : ""}`;
  document.getElementById("resultsSection").classList.add("visible");
}

function setupExportButtons() {
  document.getElementById("exportCsv").addEventListener("click", () => {
    if (!scrapedData?.rows) return;
    const { columns, rows } = scrapedData;
    const csvLines = [
      columns.join(","),
      ...rows.map(row =>
        (Array.isArray(row) ? row : [row])
          .map(cell => `"${String(cell || "").replace(/"/g, '""')}"`)
          .join(",")
      )
    ];
    downloadFile(csvLines.join("\n"), "datapull-export.csv", "text/csv");
  });

  document.getElementById("exportJson").addEventListener("click", () => {
    if (!scrapedData?.rows) return;
    const { columns, rows } = scrapedData;
    const jsonData = rows.map(row => {
      const obj = {};
      (Array.isArray(row) ? row : [row]).forEach((cell, i) => {
        obj[columns[i] || `col${i}`] = cell;
      });
      return obj;
    });
    downloadFile(JSON.stringify(jsonData, null, 2), "datapull-export.json", "application/json");
  });

  document.getElementById("exportExcel").addEventListener("click", () => {
    if (!scrapedData?.rows) return;
    const { columns, rows } = scrapedData;
    const wsData = [
      columns,
      ...rows.map(row => Array.isArray(row) ? row : [row])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = columns.map(() => ({ wch: 25 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scraped Data");
    XLSX.writeFile(wb, "datapull-export.xlsx");
  });
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function showStatus(type, message) {
  const bar = document.getElementById("statusBar");
  const text = document.getElementById("statusText");
  const spinner = document.getElementById("spinner");
  bar.className = "status-bar visible " + type;
  text.textContent = message;
  spinner.style.display = type === "loading" ? "block" : "none";
}

function hideResults() {
  document.getElementById("resultsSection").classList.remove("visible");
}

function hideRaw() {
  document.getElementById("rawSection").classList.remove("visible");
} 