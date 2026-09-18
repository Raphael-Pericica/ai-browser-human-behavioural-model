# Search Habits AI

A chrome extension that tracks my own google searches and shows me what I
actually spend my time looking up. Everything stays on my machine.

I'm a Computer and software engineering student. Before this I mostly wrote
java, so nearly everything here was new to me - javaScript, chrome extension
APIs, message passing, async code.

![Dashboard](screenshots/dashboard.png)

## What it does

You click the extension and opt in. After that it records the text of your
google searches and when you made them, sorts them into categories, and a
dashboard shows the patterns of what you search, what time of day, what you
keep searching over and over.

Nothing else is recorded.

## How it works

Four parts:

 `manifest.json` - config chrome reads first
  `content/google-search.js` - injected into google search pages only. Reads the
  query out of the URL, never the page
 `background.js` - service worker, checks you opted in, categorises, saves
  `popup/` and `dashboard/` - the UI

They all share `chrome.storage.local`.

The search text is already in the address bar, so I pull it from there instead
of reading the page. That's why the content script never touches the DOM.

## Two ways of categorising

The first is keyword matching I wrote by hand. Each category owns a word list,
whichever matches most wins.

The second is chromes built in Gemini Nano through the prompt API. It runs on
your own machine, no API key, no server, nothing sent anywhere. That mattered
because the whole point of this is that search data stays local. I didn't train
it, it comes pre-trained. I just give it a prompt and restrict the answer to my
category names with a JSON schema.

The model only runs when the keywords found nothing. If my word lists matched,
that answer is left alone. My lists know things the model doesn't - in this project for example
"java" means the language not the island.


## Privacy

 Off until you turn it on
 `chrome.storage.local` only never `sync` sync would upload your searches to
  googles servers
 Pause and delete buttons
 Optional auto-delete of searches older than 30, 90 or 365 days. Off by default -
  deleting your data is your call, not mine
 The only permission is `storage` plus access to Google search pages
 No server exists so there's nothing to send anything to

## Running it

 `chrome://extensions` turn on Developer mode
 Load unpacked, pick this folder
 Click the icon and opt in

Reload the extension card after changing files. Reload the google tab too if you
changed the content script.



 Google sometimes changes results without reloading the page, so those searches
  get missed
 No way to export your data
 Keyword lists are small, about 20 words per category
 Two searches at the same moment could race each other when writing to storage


