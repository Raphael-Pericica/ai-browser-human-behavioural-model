# Search Habits AI

A privacy-focused Chrome extension (Manifest V3) that will analyse **your own**
Google search habits locally, on your machine, and show you useful observations
about how you research things online.

Status: **Phase 2 - service worker**

## Privacy principles

These rules guide every design decision in this project:

- Tracking is **off by default** and starts only after an explicit opt-in.
- Data is stored **locally in the browser**. No backend, no external API.
- Only **Google search queries and timestamps** are recorded - never page
  contents, form data, passwords, or general browsing history.
- The user can **pause** tracking and **delete** all collected data at any time.
- The user can always see exactly what is stored and what is analysed.

## Permissions

The extension currently requests **no permissions at all**. Each permission will
be added in the phase that first needs it, and not before.

## Project structure

```
search_habits/
  manifest.json        Extension configuration read by Chrome
  background.js        Service worker - the logic that runs outside any page
  popup/
    popup.html         The control panel shown when the toolbar icon is clicked
    popup.css          Styling for that panel
    popup.js           Screen switching and button behaviour
  icons/
    icon16.png         Toolbar / favicon size
    icon48.png         Extensions management page
    icon128.png        Chrome Web Store and installation dialog
  README.md
  .gitignore
```

## Running it locally

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select this `search_habits` folder (the folder that contains `manifest.json`).
5. The extension appears in the list and its icon appears in the toolbar.

After changing any file, return to `chrome://extensions` and click the
**reload** (circular arrow) button on the extension card.

To watch the service worker's console output, click the **service worker** link
on the extension's card on that same page.

## Roadmap

| Phase | Goal | Status |
|-------|------|--------|
| 0 | Project setup and a loadable extension | done |
| 1 | Popup UI: consent screen and control panel | done |
| 2 | Manifest V3 service worker | done |
| 3 | Detect Google searches | |
| 4 | Content script to service worker messaging | |
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
