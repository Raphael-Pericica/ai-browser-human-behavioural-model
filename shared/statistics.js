//statistics worth keeping
const TIME_OF_DAY_BUCKETS = [
  { name: "morning", startHour: 5, endHour: 12 },
  { name: "afternoon", startHour: 12, endHour: 17 },
  { name: "evening", startHour: 17, endHour: 22 },
  { name: "night", startHour: 22, endHour: 5 }
];


//milliseconds multiplied
const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;


//midnight
function startOfTodayTimestamp() {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);

  return midnight.getTime();
}


//from midnight how many days ago
function startOfDaysAgoTimestamp(howManyDaysAgo) {
  return startOfTodayTimestamp() - (howManyDaysAgo * MILLISECONDS_IN_A_DAY);
}


//timestamp to readable date
function dayKeyFromTimestamp(timestamp) {
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const dayOfMonth = date.getDate();

  return year + "-" + padToTwoDigits(month) + "-" + padToTwoDigits(dayOfMonth);
}


//turns 7 into "07" so labels sort correctly as text
function padToTwoDigits(aNumber) {
  if (aNumber < 10) {
    return "0" + aNumber;
  }

  return "" + aNumber;
}


//what part of the day is it
function timeOfDayForTimestamp(timestamp) {
  const hour = new Date(timestamp).getHours();

  for (let i = 0; i < TIME_OF_DAY_BUCKETS.length; i++) {
    const bucket = TIME_OF_DAY_BUCKETS[i];

    if (bucket.startHour < bucket.endHour) {
     
      if (hour >= bucket.startHour && hour < bucket.endHour) {
        return bucket.name;
      }
    } else {
     
      if (hour >= bucket.startHour || hour < bucket.endHour) {
        return bucket.name;
      }
    }
  }

 
  return "night";
}


//count how many searches
function countSearchesSince(searches, sinceTimestamp) {
  let howMany = 0;

  for (let i = 0; i < searches.length; i++) {
    if (searches[i].timestamp >= sinceTimestamp) {
      howMany = howMany + 1;
    }
  }

  return howMany;
}


//how many searches in the last whole days
function countSearchesInLastDays(searches, howManyDays) {
  return countSearchesSince(searches, startOfDaysAgoTimestamp(howManyDays - 1));
}


//most searched categories by percentage
function rankCategories(searches) {
  const countsByName = {};

  for (let i = 0; i < searches.length; i++) {
   
    const name = readCategoryFromRecord(searches[i]);

    if (countsByName[name] === undefined) {
      countsByName[name] = 0;
    }

    countsByName[name] = countsByName[name] + 1;
  }

  //walk through names in array we collected
  const names = Object.keys(countsByName);
  const ranked = [];

  for (let i = 0; i < names.length; i++) {
    const count = countsByName[names[i]];

    let percent = 0;
    if (searches.length > 0) {
      percent = Math.round((count / searches.length) * 100);
    }

    ranked.push({
      name: names[i],
      count: count,
      percent: percent
    });
  }

 
  ranked.sort(function (a, b) {
    return b.count - a.count;
  });

  return ranked;
}


//count of how many categories have been searched
function countDistinctCategories(searches) {
  return rankCategories(searches).length;
}


//how many searches have happened during specific time of day
function countsByTimeOfDay(searches) {
  const counts = {};

  for (let i = 0; i < TIME_OF_DAY_BUCKETS.length; i++) {
    counts[TIME_OF_DAY_BUCKETS[i].name] = 0;
  }

  for (let i = 0; i < searches.length; i++) {
    const bucketName = timeOfDayForTimestamp(searches[i].timestamp);
    counts[bucketName] = counts[bucketName] + 1;
  }

  return counts;
}


//the part of the day with the most searches
function busiestTimeOfDay(searches) {
  if (searches.length === 0) {
    return null;
  }

  const counts = countsByTimeOfDay(searches);

  let bestName = null;
  let bestCount = 0;

  for (let i = 0; i < TIME_OF_DAY_BUCKETS.length; i++) {
    const name = TIME_OF_DAY_BUCKETS[i].name;

    
    if (counts[name] > bestCount) {
      bestCount = counts[name];
      bestName = name;
    }
  }

  return bestName;
}


//searches per day
function searchesPerDay(searches, howManyDays) {
  const countsByDayKey = {};

  for (let i = 0; i < searches.length; i++) {
    const dayKey = dayKeyFromTimestamp(searches[i].timestamp);

    if (countsByDayKey[dayKey] === undefined) {
      countsByDayKey[dayKey] = 0;
    }

    countsByDayKey[dayKey] = countsByDayKey[dayKey] + 1;
  }

  const days = [];

  //count from oldest day to today
  for (let daysAgo = howManyDays - 1; daysAgo >= 0; daysAgo--) {
    const timestamp = startOfDaysAgoTimestamp(daysAgo);
    const dayKey = dayKeyFromTimestamp(timestamp);

    let count = countsByDayKey[dayKey];
    if (count === undefined) {
      count = 0;
    }

    days.push({
      dayKey: dayKey,
      weekdayLabel: weekdayLabelFor(timestamp),
      count: count
    });
  }

  return days;
}


//turn monday to mon
function weekdayLabelFor(timestamp) {
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = new Date(timestamp).getDay();

  return weekdayNames[dayOfWeek];
}


//repeated searches
function findRepeatedSearches(searches) {
  const countsByKey = {};
  const firstSpellingByKey = {};

  for (let i = 0; i < searches.length; i++) {
    const original = searches[i].query;
    const key = original.trim().toLowerCase();

    if (countsByKey[key] === undefined) {
      countsByKey[key] = 0;
      firstSpellingByKey[key] = original;
    }

    countsByKey[key] = countsByKey[key] + 1;
  }

  const keys = Object.keys(countsByKey);
  const repeated = [];

  for (let i = 0; i < keys.length; i++) {
    if (countsByKey[keys[i]] > 1) {
      repeated.push({
        query: firstSpellingByKey[keys[i]],
        count: countsByKey[keys[i]]
      });
    }
  }

  repeated.sort(function (a, b) {
    return b.count - a.count;
  });

  return repeated;
}


//how many unique searches
function countUniqueQueries(searches) {
  const seenKeys = {};
  let howManyUnique = 0;

  for (let i = 0; i < searches.length; i++) {
    const key = searches[i].query.trim().toLowerCase();

    if (seenKeys[key] === undefined) {
      seenKeys[key] = true;
      howManyUnique = howManyUnique + 1;
    }
  }

  return howManyUnique;
}


//what percentage of searches are new or repeats
function uniqueQueryPercent(searches) {
  if (searches.length === 0) {
    return 0;
  }

  return Math.round((countUniqueQueries(searches) / searches.length) * 100);
}


//object for all stats so we can call in dashboard easier
function buildStatisticsSummary(searches) {
  if (searches === undefined || searches === null) {
    searches = [];
  }

  return {
    totalSearches: searches.length,

    searchesToday: countSearchesSince(searches, startOfTodayTimestamp()),
    searchesThisWeek: countSearchesInLastDays(searches, 7),
    searchesLast30Days: countSearchesInLastDays(searches, 30),

    categories: rankCategories(searches),
    distinctCategories: countDistinctCategories(searches),

    timeOfDay: countsByTimeOfDay(searches),
    busiestTimeOfDay: busiestTimeOfDay(searches),

    perDayLastWeek: searchesPerDay(searches, 7),

    repeatedSearches: findRepeatedSearches(searches),
    uniqueQueries: countUniqueQueries(searches),
    uniqueQueryPercent: uniqueQueryPercent(searches)
  };
}
