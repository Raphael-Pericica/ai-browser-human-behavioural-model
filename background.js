

const workerStartedAtTime = new Date().toLocaleTimeString();
console.log("[Search Habits AI] Service worker started at " + workerStartedAtTime);

//label must match google search
const SEARCH_MESSAGE_TYPE = "SEARCH_DETECTED";

//name of drawer in storage to avoid typos
const STORAGE_KEY_SEARCHES = "searches";

//storage limit removes older data
const MAX_STORED_SEARCHES = 5000;


//actually storing searches
function saveSearchRecord(searchRecord, whenFinished) {
  chrome.storage.local.get([STORAGE_KEY_SEARCHES], function (stored) {
//account for undefined
    let searches = stored[STORAGE_KEY_SEARCHES];

    if (searches === undefined) {
      searches = [];
    }

    // push to end of list
    searches.push(searchRecord);

    // slice takes a section of an array and gives back a new one
    
    if (searches.length > MAX_STORED_SEARCHES) {
      searches = searches.slice(searches.length - MAX_STORED_SEARCHES);
    }

  //describe what to save
    const thingsToSave = {};
    thingsToSave[STORAGE_KEY_SEARCHES] = searches;

    chrome.storage.local.set(thingsToSave, function () {
      whenFinished(searches.length);
    });
  });
}


//listen to the scout for a note
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  //check label
  if (message.type !== SEARCH_MESSAGE_TYPE) {
    return;
  }

  console.log("[Search Habits AI] Received search:", message.record.query);



  saveSearchRecord(message.record, function (totalStored) {
    console.log("[Search Habits AI] Saved. Searches now in storage:", totalStored);

    sendResponse({
      received: true,
      totalStored: totalStored
    });
  });

  
  return true;
});

//start up event
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

