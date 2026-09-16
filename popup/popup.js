

let trackingIsEnabled = false;
let trackingIsPaused = false;




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


// updates the small coloured label in the top right corner
function refreshStatusPill() {
  const statusPill = document.getElementById("status-pill");

  // clear any colour class left over from last time, then apply the right one
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


// pause button label change
function refreshPauseButton() {
  const pauseButton = document.getElementById("pause-button");

  if (trackingIsPaused) {
    pauseButton.textContent = "Resume tracking";
  } else {
    pauseButton.textContent = "Pause tracking";
  }
}




function handleEnableClick() {
  trackingIsEnabled = true;
  trackingIsPaused = false;
  refreshScreen();
}


function handleDisableClick() {
  trackingIsEnabled = false;
  trackingIsPaused = false;
  refreshScreen();
}


function handlePauseClick() {
  
  trackingIsPaused = !trackingIsPaused;
  refreshScreen();
}


function showDeleteConfirmation() {
  document.getElementById("delete-confirm").classList.remove("is-hidden");
}


function hideDeleteConfirmation() {
  document.getElementById("delete-confirm").classList.add("is-hidden");
}


function handleDeleteConfirmed() {

  console.log("Delete confirmed. No stored data exists yet in Phase 1.");
  hideDeleteConfirmation();
}



function connectButtons() {
  document.getElementById("enable-button").addEventListener("click", handleEnableClick);
  document.getElementById("disable-button").addEventListener("click", handleDisableClick);
  document.getElementById("pause-button").addEventListener("click", handlePauseClick);

  document.getElementById("delete-button").addEventListener("click", showDeleteConfirmation);
  document.getElementById("delete-yes-button").addEventListener("click", handleDeleteConfirmed);
  document.getElementById("delete-no-button").addEventListener("click", hideDeleteConfirmation);
}




function showExtensionVersion() {
  const manifest = chrome.runtime.getManifest();
  document.getElementById("version-number").textContent = manifest.version;
}



showExtensionVersion();
connectButtons();
refreshScreen();
