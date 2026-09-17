//match background labels
const STORAGE_KEY_SEARCHES = "searches";
const STORAGE_KEY_SETTINGS = "settings";


//start false incase something fails

let trackingIsEnabled = false;
let trackingIsPaused = false;


//load and save settings
function loadSettings(whenLoaded) {
  chrome.storage.local.get([STORAGE_KEY_SETTINGS], function (stored) {
    const settings = stored[STORAGE_KEY_SETTINGS];

    if (settings === undefined) {
      trackingIsEnabled = false;
      trackingIsPaused = false;
    } else {
      trackingIsEnabled = settings.trackingEnabled === true;
      trackingIsPaused = settings.trackingPaused === true;
    }

    whenLoaded();
  });
}


function saveSettings() {
  const settings = {
    trackingEnabled: trackingIsEnabled,
    trackingPaused: trackingIsPaused
  };

  const thingsToSave = {};
  thingsToSave[STORAGE_KEY_SETTINGS] = settings;

  chrome.storage.local.set(thingsToSave);
}


//count searches
function countSearchesToday(searches) {
  const midnightThisMorning = new Date();
  midnightThisMorning.setHours(0, 0, 0, 0);

  const midnightAsNumber = midnightThisMorning.getTime();

  let howManyToday = 0;

  for (let i = 0; i < searches.length; i++) {
    if (searches[i].timestamp >= midnightAsNumber) {
      howManyToday = howManyToday + 1;
    }
  }

  return howManyToday;
}


//finds most common category
function findMostSearchedCategory(searches) {
  if (searches.length === 0) {
    return null;
  }

  const countsByCategory = {};

  for (let i = 0; i < searches.length; i++) {
    const categoryName = readCategoryFromRecord(searches[i]);

    if (countsByCategory[categoryName] === undefined) {
      countsByCategory[categoryName] = 0;
    }

    countsByCategory[categoryName] = countsByCategory[categoryName] + 1;
  }

  let bestName = null;
  let bestCount = 0;

  //loop though array above
  const names = Object.keys(countsByCategory);

  for (let i = 0; i < names.length; i++) {
    if (countsByCategory[names[i]] > bestCount) {
      bestCount = countsByCategory[names[i]];
      bestName = names[i];
    }
  }

  return bestName;
}


function refreshStoredCounts() {
  chrome.storage.local.get([STORAGE_KEY_SEARCHES], function (stored) {
    let searches = stored[STORAGE_KEY_SEARCHES];

    if (searches === undefined) {
      searches = [];
    }

    document.getElementById("stat-today").textContent = countSearchesToday(searches);
    document.getElementById("stat-total").textContent = searches.length;

    const topCategory = findMostSearchedCategory(searches);

    if (topCategory === null) {
      document.getElementById("top-category-name").textContent = "nothing yet";
    } else {
      document.getElementById("top-category-name").textContent = topCategory;
    }

   //use stats
    const summary = buildStatisticsSummary(searches);

    document.getElementById("week-count").textContent = summary.searchesThisWeek;

    // busiest time of day is null when there are no searches yet.
    if (summary.busiestTimeOfDay === null) {
      document.getElementById("busiest-time").textContent = "—";
    } else {
      document.getElementById("busiest-time").textContent = summary.busiestTimeOfDay;
    }
  });
}


//display correct screen

function refreshScreen() {
  const consentScreen = document.getElementById("consent-screen");
  const controlScreen = document.getElementById("control-screen");

  if (trackingIsEnabled) {
    consentScreen.classList.add("is-hidden");
    controlScreen.classList.remove("is-hidden");
  } else {
    consentScreen.classList.remove("is-hidden");
    controlScreen.classList.add("is-hidden");
  }

  refreshStatusPill();
  refreshPauseButton();
  hideDeleteConfirmation();
}


function refreshStatusPill() {
  const statusPill = document.getElementById("status-pill");

  statusPill.classList.remove("status-pill--off", "status-pill--on", "status-pill--paused");

  if (trackingIsEnabled === false) {
    statusPill.textContent = "Not enabled";
    statusPill.classList.add("status-pill--off");
  } else if (trackingIsPaused === true) {
    statusPill.textContent = "Paused";
    statusPill.classList.add("status-pill--paused");
  } else {
    statusPill.textContent = "Tracking";
    statusPill.classList.add("status-pill--on");
  }
}


function refreshPauseButton() {
  const pauseButton = document.getElementById("pause-button");

  if (trackingIsPaused) {
    pauseButton.textContent = "Resume tracking";
  } else {
    pauseButton.textContent = "Pause tracking";
  }
}


//buttons

function handleEnableClick() {
  trackingIsEnabled = true;
  trackingIsPaused = false;

  saveSettings();
  refreshScreen();
  refreshStoredCounts();
}


function handleDisableClick() {
  trackingIsEnabled = false;
  trackingIsPaused = false;

  saveSettings();
  refreshScreen();
}


function handlePauseClick() {
  trackingIsPaused = !trackingIsPaused;

  saveSettings();
  refreshScreen();
}


function showDeleteConfirmation() {
  document.getElementById("delete-confirm").classList.remove("is-hidden");
}


function hideDeleteConfirmation() {
  document.getElementById("delete-confirm").classList.add("is-hidden");
}


//deletes searches
function handleDeleteConfirmed() {
  chrome.storage.local.remove([STORAGE_KEY_SEARCHES], function () {
    console.log("[Search Habits AI] All stored searches deleted.");

    hideDeleteConfirmation();
    refreshStoredCounts();
  });
}



//opens new tab for dashboard
function handleDashboardClick() {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
  window.close();
}


function connectButtons() {
  document.getElementById("enable-button").addEventListener("click", handleEnableClick);
  document.getElementById("dashboard-button").addEventListener("click", handleDashboardClick);
  document.getElementById("disable-button").addEventListener("click", handleDisableClick);
  document.getElementById("pause-button").addEventListener("click", handlePauseClick);

  document.getElementById("delete-button").addEventListener("click", showDeleteConfirmation);
  document.getElementById("delete-yes-button").addEventListener("click", handleDeleteConfirmed);
  document.getElementById("delete-no-button").addEventListener("click", hideDeleteConfirmation);
}



//start up


function showExtensionVersion() {
  const manifest = chrome.runtime.getManifest();
  document.getElementById("version-number").textContent = manifest.version;
}


//bug fix
showExtensionVersion();
connectButtons();

loadSettings(function () {
  refreshScreen();
  refreshStoredCounts();
});
