# Search Habits AI

A privacy-focused Chrome extension (Manifest V3) that will analyse **your own**
Google search habits locally, on your machine, and show you useful observations
about how you research things online.

Status: **Phase 4 - messages from the content script to the service worker**

## The four parts

| Part | File | What it is |
|------|------|------------|
| The registration form | `manifest.json` | Facts Chrome reads first: name, version, icons, who exists |
| The front counter | `popup/` | What you see when you click the toolbar icon. Exists only while open |
| The back office | `background.js` | Runs with no page open. Sleeps after ~30s of quiet, restarts on events |
| The scout | `content/google-search.js` | Injected into Google search pages only. Reads the address bar |

## Privacy principles

- Tracking is **off by default** and starts only after an explicit opt-in.
- Data is stored **locally in the browser**. No backend, no external API.
- Only **Google search queries and timestamps** are recorded - never page
  contents, form data, passwords, or general browsing history.
- The user can **pause** tracking and **delete** all collected data at any time.
- The user can always see exactly what is stored and what is analysed.

## Permissions and access

No API permissions are requested (`manifest.json` has no `permissions` key).

Host access is limited to Google search result pages via the `content_scripts`
match patterns:

```
https://www.google.com/search*
https://www.google.ie/search*
```

Chrome describes this to the user as *"Read and change your data on
google.com"*. That wording is Chrome's and is broader than what the code does:
the scout reads only `window.location.search`, the query string in the address
bar, and never touches page contents.

To cover another Google domain, add its pattern to that list.

## Project structure

```
search_habits/
  manifest.json              Configuration Chrome reads first
  background.js              The back office
  content/
    google-search.js         The scout, injected into Google search pages
  popup/
    popup.html               The front counter
    popup.css
    popup.js
  icons/
    icon16.png  icon48.png  icon128.png
  README.md
  .gitignore
```

## The search record

```js
{
  query: "how to learn javascript",
  timestamp: 1758024000000
}
```

`timestamp` is milliseconds since 1 January 1970, kept as a number so it sorts
and compares correctly regardless of locale.

## Messages

The scout sends, the back office listens. Every message carries a `type` label
so the back office can tell them apart as more are added.

```js
{
  type: "SEARCH_DETECTED",
  record: { query: "...", timestamp: 1758024000000 }
}
```

## Where each part logs

| Code | Console |
|------|---------|
| `popup/popup.js` | Right-click the popup, then Inspect |
| `background.js` | `chrome://extensions`, then the "service worker" link |
| `content/google-search.js` | F12 on the Google search page itself |

All messages are prefixed `[Search Habits AI]`.

## Running it locally

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select this folder.

After changing any file, click the **reload** arrow on the extension card.
After changing a content script, **also reload the Google tab**.

## Roadmap

| Phase | Goal | Status |
|-------|------|--------|
| 0 | Project setup and a loadable extension | done |
| 1 | Popup UI: consent screen and control panel | done |
| 2 | Manifest V3 service worker | done |
| 3 | Detect Google searches | done |
| 4 | Content script to service worker messaging | done |
| 5 | Local storage of searches | |
| 6 | Privacy controls: opt-in, pause, delete | |
| 7 | Search categorisation | |
| 8 | Statistics / analysis engine | |
| 9 | Dashboard | |
| 10 | Habit feedback | |
| 11 | Experimental self-reflection profile | |
| 12 | UI/UX polish | |
| 13 | Testing, privacy review, docs, packaging | |
| 14 | Possible Chrome Web Store publication | |
