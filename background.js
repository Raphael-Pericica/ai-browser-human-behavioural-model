
const workerStartedAtTime = new Date().toLocaleTimeString();

console.log("[Search Habits AI] Service worker started at " + workerStartedAtTime);



let installEventsSeenSinceStartUp = 0;




chrome.runtime.onInstalled.addListener(function (details) {
  installEventsSeenSinceStartUp = installEventsSeenSinceStartUp + 1;

  console.log("[Search Habits AI] onInstalled fired. Reason: " + details.reason);
  console.log("[Search Habits AI] Install events since this start-up: " + installEventsSeenSinceStartUp);

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


