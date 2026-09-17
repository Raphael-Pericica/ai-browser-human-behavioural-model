
importScripts("shared/categories.js");


importScripts("shared/ai-categories.js");


const workerStartedAtTime = new Date().toLocaleTimeString();
console.log("[Search Habits AI] Service worker started at " + workerStartedAtTime);


//label must match search
const SEARCH_MESSAGE_TYPE = "SEARCH_DETECTED";

//search and setting
const STORAGE_KEY_SEARCHES = "searches";
const STORAGE_KEY_SETTINGS = "settings";

//storage limit
const MAX_STORED_SEARCHES = 5000;


//read settings

function readSettings(whenReady) {
  chrome.storage.local.get([STORAGE_KEY_SETTINGS], function (stored) {
    let settings = stored[STORAGE_KEY_SETTINGS];

    //default to off
    if (settings === undefined) {
      settings = {
        trackingEnabled: false,
        trackingPaused: false
      };
    }

    whenReady(settings);
  });
}


//save search

function saveSearchRecord(searchRecord, whenFinished) {
  chrome.storage.local.get([STORAGE_KEY_SEARCHES], function (stored) {
    let searches = stored[STORAGE_KEY_SEARCHES];

    if (searches === undefined) {
      searches = [];
    }

    searches.push(searchRecord);

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


//if search does not match a category eg labelled other model will step in and determine a category best 
// matched
async function askModelToFillCategoryGap(savedRecord) {
  
  if (savedRecord.category !== CATEGORY_OTHER) {
    return;
  }

  const aiCategory = await classifyWithAi(savedRecord.query);

  //took too long
  if (aiCategory === null) {
    return;
  }

  //the model is allowed to say other too, it has not told us 
  // anything new so there is nothing to write
  if (aiCategory === CATEGORY_OTHER) {
    console.log("[Search Habits AI] Model also had no category for:", savedRecord.query);
    return;
  }

  console.log(
    "[Search Habits AI] Model filled a gap: Other ->",
    aiCategory, "for:", savedRecord.query
  );

  replaceCategoryForRecord(savedRecord.id, aiCategory);
}


//finds record by id then rewrites the category
function replaceCategoryForRecord(recordId, newCategory) {
  chrome.storage.local.get([STORAGE_KEY_SEARCHES], function (stored) {
    const searches = stored[STORAGE_KEY_SEARCHES];

    if (searches === undefined) {
      return;
    }

    let wasFound = false;

    for (let i = 0; i < searches.length; i++) {
      if (searches[i].id === recordId) {
        searches[i].category = newCategory;
        searches[i].categorySource = "ai";
        wasFound = true;
        break;
      }
    }

    
    if (wasFound === false) {
      return;
    }

    const thingsToSave = {};
    thingsToSave[STORAGE_KEY_SEARCHES] = searches;

    chrome.storage.local.set(thingsToSave);
  });
}


//gate listen from scout then pass through
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type !== SEARCH_MESSAGE_TYPE) {
    return;
  }

  readSettings(function (settings) {
    
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

    //store category on record
    const category = classifySearchQuery(message.record.query);

    const recordToSave = {
      //gives a long random id avoid collisions
      id: crypto.randomUUID(),
      query: message.record.query,
      timestamp: message.record.timestamp,
      category: category,
      //tracks which method categorised ie ai model or my list
      categorySource: "keywords"
    };

    console.log("[Search Habits AI] Received search:", recordToSave.query);
    console.log("[Search Habits AI] Category:", recordToSave.category);

    saveSearchRecord(recordToSave, function (totalStored) {
      console.log("[Search Habits AI] Saved. Searches now in storage:", totalStored);
      sendResponse({
        received: true,
        saved: true,
        category: category,
        totalStored: totalStored
      });

      //save record
      askModelToFillCategoryGap(recordToSave);
    });
  });

  
  return true;
});


//start up events

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
