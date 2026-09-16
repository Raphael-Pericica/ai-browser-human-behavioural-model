# Search Habits AI

A privacy-focused Chrome extension (Manifest V3) that analyses **your own**
Google search habits locally, on your machine.

Status: **Phase 6 - privacy controls enforced**

## The four parts

| Part | File | What it is |
|------|------|------------|
| The registration form | `manifest.json` | Facts Chrome reads first: name, version, icons, permissions |
| The front counter | `popup/` | What you see when you click the toolbar icon. Exists only while open |
| The back office | `background.js` | Runs with no page open. Sleeps after ~30s of quiet |
| The scout | `content/google-search.js` | Injected into Google search pages only. Reads the address bar |

All four share one filing cabinet: `chrome.storage.local`.

## Privacy principles

- Tracking is **off by default** and starts only after an explicit opt-in.
- Data is stored **locally in the browser**. No backend, no external API.
- Only **Google search queries and timestamps** are recorded - never page
  contents, form data, passwords, or general browsing history.
- The user can **pause** tracking and **delete** all collected data at any time.
- The user can always see exactly what is stored and what is analysed.

### How the opt-in is enforced

Every search in the extension passes through one listener in `background.js`,
and that listener is the only place that decides whether a search is kept:

```js
if (settings.trackingEnabled !== true) { ...refuse... }
if (settings.trackingPaused === true)  { ...refuse... }
```

Two deliberate choices:

- The check is `!== true`, not `=== false`. A missing or corrupted value
  refuses rather than allows. Only an explicit `true` gets through.
- When no settings exist at all - a brand new install - the default is
  tracking off. A bug that wiped the settings would fail closed, not open.

Deleting data does not change the settings, and changing the settings does not
delete data. Two separate decisions, each made by the user.

## Storage

`chrome.storage.local` is used, never `chrome.storage.sync`. Sync would upload
search queries to Google's servers, which would defeat the entire point.

| Key | Contents |
|-----|----------|
| `searches` | An array of search records, oldest first, capped at 5000 |
| `settings` | `{ trackingEnabled: boolean, trackingPaused: boolean }` |

A search record:

```js
{
  query: "how to learn javascript",
  timestamp: 1758024000000
}
```

`timestamp` is milliseconds since 1 January 1970, kept as a number so it sorts
and compares correctly regardless of locale.

## Permissions and access

`"permissions": ["storage"]` - lets the extension write to its own private box.
Chrome shows the user no warning for this, because it grants no access to
anybody else's data.

Host access is limited to Google search result pages:

```
https://www.google.com/search*
https://www.google.ie/search*
```

Chrome describes that as *"Read and change your data on google.com"*, which is
broader than what the code does: the scout reads only the query string in the
address bar and never touches page contents.

## Project structure

```
search_habits/
  manifest.json              Configuration Chrome reads first
  background.js              The back office: the opt-in gate, and saving
  content/
    google-search.js         The scout, injected into Google search pages
  popup/
    popup.html               The front counter
    popup.css
    popup.js                 Screens, buttons, settings, counts
  icons/
    icon16.png  icon48.png  icon128.png
  README.md
  .gitignore
```

## Messages

```js
{
  type: "SEARCH_DETECTED",
  record: { query: "...", timestamp: 1758024000000 }
}
```

The back office replies with one of:

```js
{ received: true, saved: true,  totalStored: 12 }
{ received: true, saved: false, reason: "not-enabled" }
{ received: true, saved: false, reason: "paused" }
```

Because the reply is asynchronous, the listener ends with `return true` to keep
the message channel open.

## Where each part logs

| Code | Console |
|------|---------|
| `popup/popup.js` | Right-click the popup, then Inspect |
| `background.js` | `chrome://extensions`, then the "service worker" link |
| `content/google-search.js` | F12 on the Google search page itself |

## Inspecting stored data

In the service worker console:

```js
chrome.storage.local.get(["searches", "settings"], (r) => console.log(r));
```

## Running it locally

1. `chrome://extensions`, turn on **Developer mode**.
2. **Load unpacked**, select this folder.

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
| 5 | Local storage of searches | done |
| 6 | Privacy controls: opt-in, pause, delete | done |
| 7 | Search categorisation | |
| 8 | Statistics / analysis engine | |
| 9 | Dashboard | |
| 10 | Habit feedback | |
| 11 | Experimental self-reflection profile | |
| 12 | UI/UX polish | |
| 13 | Testing, privacy review, docs, packaging | |
| 14 | Possible Chrome Web Store publication | |

Not yet built: a data retention setting (auto-delete searches older than N
days). Worth adding before any public release.
