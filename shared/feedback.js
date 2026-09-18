//min amount of seaches
const MINIMUM_SEARCHES_FOR_ANY_FEEDBACK = 10;

const MINIMUM_SEARCHES_PER_CATEGORY = 3;


const MINIMUM_CHANGE_IN_SEARCHES = 4;
const MINIMUM_CHANGE_MULTIPLE = 1.5;

//again the mins
const MINIMUM_REPEATS = 3;

//searches in a part of the day
const CONCENTRATION_PERCENT = 40;

//max feedback
const MAXIMUM_OBSERVATIONS = 5;



//everything from midnight 6 days ago to 7 days now
function searchesFromThisWeek(searches) {
  const startOfThisWeek = startOfDaysAgoTimestamp(6);

  return keepSearchesBetween(searches, startOfThisWeek, Infinity);
}


//compare the 7 days before this 7 days to comapre each week
function searchesFromLastWeek(searches) {
  const startOfLastWeek = startOfDaysAgoTimestamp(13);
  const startOfThisWeek = startOfDaysAgoTimestamp(6);

  return keepSearchesBetween(searches, startOfLastWeek, startOfThisWeek);
}


//keep searches at from and up to toTimestamp avoid midnight search in both weeks
function keepSearchesBetween(searches, fromTimestamp, toTimestamp) {
  const kept = [];

  for (let i = 0; i < searches.length; i++) {
    const when = searches[i].timestamp;

    if (when >= fromTimestamp && when < toTimestamp) {
      kept.push(searches[i]);
    }
  }

  return kept;
}


//how many searches belong to category
function countSearchesInCategory(searches, categoryName) {
  let howMany = 0;

  for (let i = 0; i < searches.length; i++) {
    if (readCategoryFromRecord(searches[i]) === categoryName) {
      howMany = howMany + 1;
    }
  }

  return howMany;
}


//return a sentence or null


//what you searched about most this week
function observeTopCategory(thisWeek) {
  const ranked = rankCategories(thisWeek);

  if (ranked.length === 0) {
    return null;
  }

  const top = ranked[0];

  if (top.count < MINIMUM_SEARCHES_PER_CATEGORY) {
    return null;
  }

  //other category return null
  if (top.name === CATEGORY_OTHER || top.name === CATEGORY_UNKNOWN) {
    return null;
  }

  return top.name + " was your most searched topic this week, " +
    top.count + " of " + thisWeek.length + " searches.";
}


//category you searched more this week
function observeCategoryChange(thisWeek, lastWeek) {
  if (lastWeek.length === 0) {
    return null;
  }

  const ranked = rankCategories(thisWeek);

  for (let i = 0; i < ranked.length; i++) {
    const name = ranked[i].name;

    if (name === CATEGORY_OTHER || name === CATEGORY_UNKNOWN) {
      continue;
    }

    const now = ranked[i].count;
    const before = countSearchesInCategory(lastWeek, name);

    //if searhces was 0 before return new this week
    if (before === 0) {
      if (now >= MINIMUM_CHANGE_IN_SEARCHES) {
        return name + " is new this week - " + now +
          " searches, none the week before.";
      }

      continue;
    }

    const wentUp = now - before >= MINIMUM_CHANGE_IN_SEARCHES &&
      now >= before * MINIMUM_CHANGE_MULTIPLE;

    if (wentUp) {
      return "You searched about " + name + " more this week than last week, " +
        now + " compared with " + before + ".";
    }

    const wentDown = before - now >= MINIMUM_CHANGE_IN_SEARCHES &&
      before >= now * MINIMUM_CHANGE_MULTIPLE;

    if (wentDown) {
      return "You searched about " + name + " less this week than last week, " +
        now + " compared with " + before + ".";
    }
  }

  return null;
}


// time of day searches are made
function observeTimeOfDay(thisWeek) {
  const busiest = busiestTimeOfDay(thisWeek);

  if (busiest === null) {
    return null;
  }

  const counts = countsByTimeOfDay(thisWeek);
  const share = Math.round((counts[busiest] / thisWeek.length) * 100);

  if (share < CONCENTRATION_PERCENT) {
    return null;
  }

  if (busiest === "night") {
    return share + "% of your searches this week were between 22:00 and 05:00.";
  }

  return "Most of your searching happened in the " + busiest +
    ", " + share + "% of the week's searches.";
}


//repeated searches
function observeRepeatedSearch(thisWeek) {
  const repeats = findRepeatedSearches(thisWeek);

  if (repeats.length === 0) {
    return null;
  }

  const top = repeats[0];

  if (top.count < MINIMUM_REPEATS) {
    return null;
  }

  return 'You searched "' + top.query + '" ' + top.count + " times this week.";
}


//covered more or less topics than before?
function observeVariety(thisWeek, lastWeek) {
  if (lastWeek.length < MINIMUM_SEARCHES_FOR_ANY_FEEDBACK) {
    return null;
  }

  const now = countDistinctCategories(thisWeek);
  const before = countDistinctCategories(lastWeek);

  if (now - before >= 2) {
    return "You covered " + now + " different categories this week, up from " +
      before + ".";
  }

  if (before - now >= 2) {
    return "You covered " + now + " different categories this week, down from " +
      before + ".";
  }

  return null;
}


//no searches
function observeQuietDays(searches) {
  const perDay = searchesPerDay(searches, 7);

  let quietDays = 0;

  for (let i = 0; i < perDay.length; i++) {
    if (perDay[i].count === 0) {
      quietDays = quietDays + 1;
    }
  }

  if (quietDays < 2) {
    return null;
  }

  if (quietDays === 7) {
    return null;
  }

  return quietDays + " of the last 7 days had no searches recorded.";
}


//how much of this week was new
function observeRepeatRate(thisWeek) {
  if (thisWeek.length < MINIMUM_SEARCHES_FOR_ANY_FEEDBACK) {
    return null;
  }

  const newPercent = uniqueQueryPercent(thisWeek);

  if (newPercent >= 90) {
    return newPercent + "% of this week's searches were ones you hadn't typed before.";
  }

  if (newPercent <= 60) {
    return "Only " + newPercent +
      "% of this week's searches were new - the rest were repeats.";
  }

  return null;
}


//building feedback
function buildFeedbackObservations(searches) {
  if (searches === undefined || searches === null) {
    return [];
  }

  const thisWeek = searchesFromThisWeek(searches);
  const lastWeek = searchesFromLastWeek(searches);

  
  if (thisWeek.length + lastWeek.length < MINIMUM_SEARCHES_FOR_ANY_FEEDBACK) {
    return [];
  }

  const candidates = [
    observeTopCategory(thisWeek),
    observeCategoryChange(thisWeek, lastWeek),
    observeRepeatedSearch(thisWeek),
    observeTimeOfDay(thisWeek),
    observeVariety(thisWeek, lastWeek),
    observeRepeatRate(thisWeek),
    observeQuietDays(searches)
  ];

  const observations = [];

  for (let i = 0; i < candidates.length; i++) {
   
    if (candidates[i] === null) {
      continue;
    }

    observations.push(candidates[i]);

    if (observations.length >= MAXIMUM_OBSERVATIONS) {
      break;
    }
  }

  return observations;
}


//how many more searches are needed to display feedback to avoid empty box
function searchesNeededForFeedback(searches) {
  if (searches === undefined || searches === null) {
    return MINIMUM_SEARCHES_FOR_ANY_FEEDBACK;
  }

  const inLastFortnight =
    searchesFromThisWeek(searches).length + searchesFromLastWeek(searches).length;

  const stillNeeded = MINIMUM_SEARCHES_FOR_ANY_FEEDBACK - inLastFortnight;

  if (stillNeeded < 0) {
    return 0;
  }

  return stillNeeded;
}
