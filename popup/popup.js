
//both names must match the ones in background
const STORAGE_KEY_SEARCHES = "searches";
const STORAGE_KEY_SETTINGS = "settings";


let trackingIsEnabled = false;
let trackingIsPaused = false;


//loads the settings and saves them then execute them
function loadSettings(whenLoaded) {
  chrome.storage.local.get([STORAGE_KEY_SETTINGS], function (stored) {
    const settings = stored[STORAGE_KEY_SETTINGS];

    if (settings === undefined) {
      // Brand new install. Stay off.
      trackingIsEnabled = false;
      trackingIsPaused = false;
    } else {
      trackingIsEnabled = settings.trackingEnabled === true;
      trackingIsPaused = settings.trackingPaused === true;
    }

    whenLoaded();
  });
}


//writes the two variables back into storage
function saveSettings() {
  const settings = {
    trackingEnabled: trackingIsEnabled,
    trackingPaused: trackingIsPaused
  };

  const thingsToSave = {};
  thingsToSave[STORAGE_KEY_SETTINGS] = settings;

  chrome.storage.local.set(thingsToSave);
}


//reads count and turns to milliseconds
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


function refreshStoredCounts() {
  chrome.storage.local.get([STORAGE_KEY_SEARCHES], function (stored) {
    let searches = stored[STORAGE_KEY_SEARCHES];

    if (searches === undefined) {
      searches = [];
    }

    document.getElementById("stat-today").textContent = countSearchesToday(searches);
    document.getElementById("stat-total").textContent = searches.length;
  });
}


//display the correct screen

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


//deletes data
function handleDeleteConfirmed() {
  chrome.storage.local.remove([STORAGE_KEY_SEARCHES], function () {
    console.log("[Search Habits AI] All stored searches deleted.");

    hideDeleteConfirmation();
    refreshStoredCounts();
  });
}


function connectButtons() {
  document.getElementById("enable-button").addEventListener("click", handleEnableClick);
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


//consent screen bug fix

showExtensionVersion();
connectButtons();

loadSettings(function () {
  refreshScreen();
  refreshStoredCounts();
});
