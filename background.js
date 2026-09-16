//user needs to opt in for saving to work

const workerStartedAtTime = new Date().toLocaleTimeString();
console.log("[Search Habits AI] Service worker started at " + workerStartedAtTime);

//scout label
const SEARCH_MESSAGE_TYPE = "SEARCH_DETECTED";

//drawers for storage
const STORAGE_KEY_SEARCHES = "searches";
const STORAGE_KEY_SETTINGS = "settings";

//storage limit
const MAX_STORED_SEARCHES = 5000;



//take a function and call it once its arrived
function readSettings(whenReady) {
  chrome.storage.local.get([STORAGE_KEY_SETTINGS], function (stored) {
    let settings = stored[STORAGE_KEY_SETTINGS];

    //default is opt out for privacy
    if (settings === undefined) {
      settings = {
        trackingEnabled: false,
        trackingPaused: false
      };
    }

    whenReady(settings);
  });
}


//read the list then add and then write new list
function saveSearchRecord(searchRecord, whenFinished) {
  chrome.storage.local.get([STORAGE_KEY_SEARCHES], function (stored) {
    let searches = stored[STORAGE_KEY_SEARCHES];

    //account for undefined
    if (searches === undefined) {
      searches = [];
    }

    searches.push(searchRecord);

    //keep newest searches delete older ones
    if (searches.length > MAX_STORED_SEARCHES) {
      searches = searches.slice(searches.length - MAX_STORED_SEARCHES);
    }

    const thingsToSave = {};
    thingsToSave[STORAGE_KEY_SEARCHES] = searches;

    chrome.storage.local.set(thingsToSave, function () {
      whenFinished(searches.length);
    });
  });
}


//listen for notes from scout, everything passes through this gate and then decide what to do here

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type !== SEARCH_MESSAGE_TYPE) {
    return;
  }

  readSettings(function (settings) {
   //check !== true
    if (settings.trackingEnabled !== true) {
      console.log("[Search Habits AI] Search ignored - tracking is not enabled.");
      sendResponse({ received: true, saved: false, reason: "not-enabled" });
      return;
    }

    if (settings.trackingPaused === true) {
      console.log("[Search Habits AI] Search ignored - tracking is paused.");
      sendResponse({ received: true, saved: false, reason: "paused" });
      return;
    }

    console.log("[Search Habits AI] Received search:", message.record.query);

    saveSearchRecord(message.record, function (totalStored) {
      console.log("[Search Habits AI] Saved. Searches now in storage:", totalStored);
      sendResponse({ received: true, saved: true, totalStored: totalStored });
    });
  });

  return true;
});



chrome.runtime.onInstalled.addListener(function (details) {
  console.log("[Search Habits AI] onInstalled fired. Reason: " + details.reason);

  if (details.reason === "install") {
    console.log("[Search Habits AI] First install. Tracking is off until the user opts in.");
  }

  if (details.reason === "update") {
    console.log("[Search Habits AI] Updated from version " + details.previousVersion);
  }
});


chrome.runtime.onStartup.addListener(function () {
  console.log("[Search Habits AI] Chrome started up.");
});
