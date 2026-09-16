
function showExtensionVersion() {
  const manifest = chrome.runtime.getManifest();

  // document.getElementById finds the element with id="version-number"
  // in popup.html.
  const versionElement = document.getElementById("version-number");

  versionElement.textContent = manifest.version;
}

showExtensionVersion();
