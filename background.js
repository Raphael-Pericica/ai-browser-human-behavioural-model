
const workerStartedAtTime = new Date().toLocaleTimeString();

console.log("[Search Habits AI] Service worker started at " + workerStartedAtTime);

//label for searches
const SEARCH_MESSAGE_TYPE = "SEARCH_DETECTED";



let searchesSeenSinceStartUp = 0;




chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
//checkk label
  if (message.type !== SEARCH_MESSAGE_TYPE) {
    return;
  }

  searchesSeenSinceStartUp = searchesSeenSinceStartUp + 1;

  console.log("[Search Habits AI] Received search:", message.record.query);
  console.log("[Search Habits AI] Recorded at:", new Date(message.record.timestamp).toLocaleTimeString());
  console.log("[Search Habits AI] Searches since this start-up:", searchesSeenSinceStartUp);

 
  sendResponse({
    received: true,
    searchesSeenSinceStartUp: searchesSeenSinceStartUp
  });
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


