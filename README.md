# ⚡ DataPull — AI Web Scraper

> Extract any data from any website in plain English. No coding required.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)
![AI Powered](https://img.shields.io/badge/AI-Groq%20LLaMA-cyan)
![Free](https://img.shields.io/badge/Cost-Free-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0-blue)

---

## 🚀 What is DataPull?

DataPull is a Chrome Extension that lets you scrape any webpage by simply describing what you want in plain English. Powered by Groq AI (LLaMA 3.3 70B), it extracts structured data from any website and exports it to CSV, JSON, or Excel.

**No Python. No Selenium. No blocked requests. No cost.**

---

## ✨ Features

- 🌐 Works on any public website
- 💬 Plain English queries — no selectors or rules needed
- 🤖 Groq AI powered — free, fast, accurate
- 📜 Auto-scroll — handles dynamic/lazy-loaded pages
- 🧹 Smart filtering — removes nav/footer/ads automatically
- 📊 Export to CSV, JSON, and Excel (.xlsx)
- 🔒 No antibot issues — runs inside real Chrome browser

---

## 📦 Installation

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/datapull.git
cd datapull
```

### 2. Get a free Groq API key
- Go to [console.groq.com](https://console.groq.com)
- Sign up for free
- Create an API key (starts with `gsk_...`)

### 3. Add your API key
Open `background.js` and replace:
```javascript
const GROQ_API_KEY = "your_groq_api_key_here";
```

### 4. Download SheetJS (for Excel export)
- Go to: `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`
- Save as `xlsx.full.min.js` inside the project folder

### 5. Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load Unpacked**
4. Select the `datapull` folder

---

## 🎯 How to Use

1. Open any webpage (e.g. Amazon, IMDB, Mitsubishi Cars)
2. Click the **DataPull ⚡** icon in your Chrome toolbar
3. Type what you want to extract:
   - `Get all product names and prices`
   - `Extract all movie titles and ratings`
   - `Get all job titles and company names`
4. Click **Read This Page**
5. Wait for AI to extract the data
6. Download as **CSV**, **JSON**, or **Excel**

---

## 🌐 Tested Websites

| Website | Query | Result |
|---------|-------|--------|
| amazon.in | Product names & prices | ✅ Working |
| imdb.com/chart/top | Movie names & ratings | ✅ Working |
| mitsubishicars.com | Car models & prices | ✅ Working |
| youtube.com | Video titles | ✅ Working |
| Gmail Inbox | Sender names & dates | ⚠️ Partial (virtual DOM) |

---

## 📁 Project Structure

```
datapull/
├── manifest.json          # Chrome extension config
├── popup.html             # Extension UI
├── popup.js               # UI interactions & export logic
├── content_script.js      # Page reader & smart extractor
├── background.js          # Groq AI API calls
├── xlsx.full.min.js       # Excel export library (download separately)
├── icon.png               # Extension icon
├── README.md              # This file
├── CHANGELOG.md           # Version history
├── .gitignore             # Git ignore rules
└── LICENSE                # MIT License
```

---

## ⚙️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Extension | Chrome Extensions API (Manifest V3) |
| Page Reading | JavaScript DOM API |
| AI Model | Groq — LLaMA 3.3 70B Versatile |
| Excel Export | SheetJS (xlsx) |
| UI Fonts | Google Fonts (Syne + DM Mono) |

---

## ⚠️ Limitations

- **Virtual scroll sites** (Gmail, Twitter) — only loads visible items
- **Login-required pages** — user must be logged in manually
- **Groq free tier** — 100,000 tokens/day limit
- **Large pages** — content trimmed to fit token limits

---

## 🔮 Roadmap

- [ ] Pagination support (auto next page)
- [ ] Scheduled scraping
- [ ] Scrape history dashboard
- [ ] Gmail/Twitter via official APIs
- [ ] Secure API key storage
- [ ] Multi-language support

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👨‍💻 Built By

Built in-house as an internal tool. Powered by [Groq](https://groq.com) and [Chrome Extensions API](https://developer.chrome.com/docs/extensions/).
