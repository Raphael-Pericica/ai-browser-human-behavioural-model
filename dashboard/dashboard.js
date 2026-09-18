
//label match
const STORAGE_KEY_SEARCHES = "searches";
const STORAGE_KEY_SETTINGS = "settings";

//limit
const MAX_REPEAT_ROWS = 12;


function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className !== undefined) {
    element.className = className;
  }

  if (text !== undefined) {
    //textContent not innerHTML
    element.textContent = text;
  }

  return element;
}



function removeAllChildren(element) {
  while (element.firstChild !== null) {
    element.removeChild(element.firstChild);
  }
}



function percentOfLargest(value, largestValue) {
  if (largestValue <= 0) {
    return 0;
  }

  return (value / largestValue) * 100;
}



function findLargestCount(items) {
  let largest = 0;

  for (let i = 0; i < items.length; i++) {
    if (items[i].count > largest) {
      largest = items[i].count;
    }
  }

  return largest;
}




function drawPerDayChart(perDay) {
  const chart = document.getElementById("per-day-chart");
  removeAllChildren(chart);

  const largest = findLargestCount(perDay);

  for (let i = 0; i < perDay.length; i++) {
    const day = perDay[i];

    const column = makeElement("div", "column");


    column.appendChild(makeElement("div", "column-value", String(day.count)));

   
    const track = makeElement("div", "column-track");
    const fill = makeElement("div", "column-fill");

    fill.style.height = percentOfLargest(day.count, largest) + "%";


    track.title = day.dayKey + ": " + day.count + " searches";

    track.appendChild(fill);
    column.appendChild(track);


    let labelClass = "column-label";
    if (i === perDay.length - 1) {
      labelClass = "column-label column-label--today";
    }

    column.appendChild(makeElement("div", labelClass, day.weekdayLabel));

    chart.appendChild(column);
  }
}



function makeBarRow(name, count, largestCount, valueText) {
  const row = makeElement("div", "bar-row");

  const nameElement = makeElement("div", "bar-name", name);


  nameElement.title = name;

  row.appendChild(nameElement);

  const track = makeElement("div", "bar-track");
  const fill = makeElement("div", "bar-fill");

  fill.style.width = percentOfLargest(count, largestCount) + "%";

  track.title = name + ": " + count;
  track.appendChild(fill);
  row.appendChild(track);

  row.appendChild(makeElement("div", "bar-value", valueText));

  return row;
}



//display the feedback
function drawObservations(searches) {
  const list = document.getElementById("observation-list");
  removeAllChildren(list);

  const observations = buildFeedbackObservations(searches);

  if (observations.length === 0) {
    const stillNeeded = searchesNeededForFeedback(searches);

    const item = makeElement(
      "li",
      "observation observation--empty",
      "Not enough searches in the last fortnight yet. About " + stillNeeded +
      " more and this will start filling in."
    );

    list.appendChild(item);
    return;
  }

  for (let i = 0; i < observations.length; i++) {
    list.appendChild(makeElement("li", "observation", observations[i]));
  }
}


//search styles cards
function drawSearchStyle(searches) {
  const nameElement = document.getElementById("style-name");
  const blurbElement = document.getElementById("style-blurb");
  const closeElement = document.getElementById("style-close");
  const evidenceList = document.getElementById("style-evidence");

  removeAllChildren(evidenceList);
  closeElement.classList.add("is-hidden");

  const style = buildSearchStyle(searches);

  if (style === null) {
    const stillNeeded = searchesNeededForProfile(searches);

    nameElement.textContent = "Not enough yet";
    blurbElement.textContent =
      "About " + stillNeeded + " more searches in the last 30 days and a style " +
      "will be worked out.";

    return;
  }

  nameElement.textContent = style.name;
  blurbElement.textContent = style.blurb;

  
  if (style.isClose) {
    closeElement.textContent =
      "This was close - " + style.runnerUp.name + " scored almost the same (" +
      style.score + " vs " + style.runnerUp.score + "). Read it as somewhere " +
      "between the two.";

    closeElement.classList.remove("is-hidden");
  }

  for (let i = 0; i < style.evidence.length; i++) {
    evidenceList.appendChild(makeElement("li", "evidence", style.evidence[i]));
  }

  evidenceList.appendChild(
    makeElement("li", "evidence evidence--muted",
      "worked out from " + style.searchesConsidered + " searches in the last 30 days")
  );
}


//which model was used
function describeCategorySources(searches) {
  let byAi = 0;
  let byKeywords = 0;
  let unknown = 0;

  for (let i = 0; i < searches.length; i++) {
    if (searches[i].categorySource === "ai") {
      byAi = byAi + 1;
    } else if (searches[i].categorySource === "keywords") {
      byKeywords = byKeywords + 1;
    } else {
     
      unknown = unknown + 1;
    }
  }

  const note = document.getElementById("category-note");

  const parts = [];

  if (byAi > 0) {
    parts.push(byAi + " by the on-device model");
  }

  if (byKeywords > 0) {
    parts.push(byKeywords + " by keyword matching");
  }

  if (unknown > 0) {
    parts.push(unknown + " from before this was tracked");
  }

  note.textContent = parts.join(", ") + ". Categories are approximate either way.";
}


function drawCategoryChart(categories) {
  const chart = document.getElementById("category-chart");
  removeAllChildren(chart);

  const largest = findLargestCount(categories);

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];

   
    const valueText = category.count + " · " + category.percent + "%";

    chart.appendChild(makeBarRow(category.name, category.count, largest, valueText));
  }
}


function drawTimeOfDayChart(timeOfDay) {
  const chart = document.getElementById("time-of-day-chart");
  removeAllChildren(chart);


  const orderedNames = ["morning", "afternoon", "evening", "night"];

  const asItems = [];
  for (let i = 0; i < orderedNames.length; i++) {
    asItems.push({ name: orderedNames[i], count: timeOfDay[orderedNames[i]] });
  }

  const largest = findLargestCount(asItems);

  for (let i = 0; i < asItems.length; i++) {
    chart.appendChild(
      makeBarRow(asItems[i].name, asItems[i].count, largest, String(asItems[i].count))
    );
  }
}


function drawRepeatsTable(repeatedSearches) {
  const body = document.getElementById("repeats-body");
  const note = document.getElementById("repeats-note");

  removeAllChildren(body);

  if (repeatedSearches.length === 0) {
    note.textContent = "Every search so far has been different.";

    const row = makeElement("tr");
    const cell = makeElement("td", "empty-row", "Nothing repeated yet.");

   
    cell.colSpan = 2;

    row.appendChild(cell);
    body.appendChild(row);
    return;
  }


  const howManyRows = Math.min(repeatedSearches.length, MAX_REPEAT_ROWS);


  if (howManyRows < repeatedSearches.length) {
    note.textContent =
      repeatedSearches.length + " searches were typed more than once. Showing the top " +
      howManyRows + ".";
  } else {
    note.textContent =
      repeatedSearches.length + " searches were typed more than once.";
  }

  for (let i = 0; i < howManyRows; i++) {
    const repeat = repeatedSearches[i];

    const row = makeElement("tr");

    row.appendChild(makeElement("td", undefined, repeat.query));
    row.appendChild(makeElement("td", "numeric", String(repeat.count)));

    body.appendChild(row);
  }
}



function fillHeadlineNumbers(summary) {
  document.getElementById("kpi-today").textContent = summary.searchesToday;
  document.getElementById("kpi-week").textContent = summary.searchesThisWeek;
  document.getElementById("kpi-month").textContent = summary.searchesLast30Days;
  document.getElementById("kpi-total").textContent = summary.totalSearches;

  document.getElementById("kpi-distinct-categories").textContent =
    summary.distinctCategories;

  document.getElementById("kpi-unique-percent").textContent =
    summary.uniqueQueryPercent + "%";


  document.getElementById("variety-note").textContent =
    "Your " + summary.totalSearches + " searches spread across " +
    summary.distinctCategories + " categories, with " +
    summary.uniqueQueries + " different queries.";
}


function showStatusPill(settings) {
  const pill = document.getElementById("status-pill");

  pill.classList.remove("status-pill--off", "status-pill--on", "status-pill--paused");

  if (settings.trackingEnabled !== true) {
    pill.textContent = "Not enabled";
    pill.classList.add("status-pill--off");
  } else if (settings.trackingPaused === true) {
    pill.textContent = "Paused";
    pill.classList.add("status-pill--paused");
  } else {
    pill.textContent = "Tracking";
    pill.classList.add("status-pill--on");
  }
}



function showOnlyState(stateElementId) {
  const allStateIds = ["not-enabled-state", "no-data-state", "dashboard-state"];

  for (let i = 0; i < allStateIds.length; i++) {
    const element = document.getElementById(allStateIds[i]);

    if (allStateIds[i] === stateElementId) {
      element.classList.remove("is-hidden");
    } else {
      element.classList.add("is-hidden");
    }
  }
}


function showVersion() {
  document.getElementById("version-number").textContent =
    chrome.runtime.getManifest().version;
}



function loadEverythingAndDraw() {
  chrome.storage.local.get(
    [STORAGE_KEY_SEARCHES, STORAGE_KEY_SETTINGS],
    function (stored) {
      let searches = stored[STORAGE_KEY_SEARCHES];
      if (searches === undefined) {
        searches = [];
      }

      let settings = stored[STORAGE_KEY_SETTINGS];
      if (settings === undefined) {
        settings = { trackingEnabled: false, trackingPaused: false };
      }

      showStatusPill(settings);

      if (settings.trackingEnabled !== true && searches.length === 0) {
        showOnlyState("not-enabled-state");
        return;
      }

      if (searches.length === 0) {
        showOnlyState("no-data-state");
        return;
      }

    
      const summary = buildStatisticsSummary(searches);

      drawObservations(searches);
      fillHeadlineNumbers(summary);
      drawPerDayChart(summary.perDayLastWeek);
      describeCategorySources(searches);
      drawCategoryChart(summary.categories);
      drawTimeOfDayChart(summary.timeOfDay);
      drawSearchStyle(searches);
      drawRepeatsTable(summary.repeatedSearches);

      showOnlyState("dashboard-state");
    }
  );
}



chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName !== "local") {
    return;
  }

  loadEverythingAndDraw();
});


showVersion();
loadEverythingAndDraw();
