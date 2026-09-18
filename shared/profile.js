//1 month
const PROFILE_WINDOW_DAYS = 30;

//min
const MINIMUM_SEARCHES_FOR_PROFILE = 25;


const CLOSE_SCORE_GAP = 8;


const MINIMUM_WINNING_SCORE = 40;

//what to show when nothing clears
const MIXED_STYLE = {
  name: "No clear style",
  blurb: "Your searching this month doesnt lean strongly in any one direction, " +
    "which is the most common result."
};



const LEISURE_CATEGORIES = ["Entertainment", "Gaming", "Sports", "Food"];
const STUDY_CATEGORIES = ["Education", "Programming", "Technology"];

//words that make a search look like a question
const QUESTION_STARTERS = [
  "what", "why", "how", "when", "where", "who", "which",
  "is", "are", "does", "do", "can", "should", "will"
];

//words that make a search look like somebody trying to fix something
const TROUBLESHOOTING_PHRASES = [
  "how to", "fix", "error", "not working", "won t", "wont", "broken",
  "failed", "cannot", "can t", "stuck", "issue", "problem", "troubleshoot",
  "why is my", "why does my", "undo", "reset"
];


//how spread out searches are across categories
function signalTopicSpread(searches) {
  if (searches.length === 0) {
    return 0;
  }

  const ranked = rankCategories(searches);

  //past 8 its counted as one off categories
  let breadth = (ranked.length / 8) * 100;
  if (breadth > 100) {
    breadth = 100;
  }

  //if the top category is 100% of searches this is 0
  const evenness = 100 - ranked[0].percent;

  return (breadth + evenness) / 2;
}


//how much repeated searches
function signalRepeatDepth(searches) {
  return 100 - uniqueQueryPercent(searches);
}


//what amount of searches are questions
function signalQuestionShare(searches) {
  if (searches.length === 0) {
    return 0;
  }

  let questions = 0;

  for (let i = 0; i < searches.length; i++) {
    if (looksLikeAQuestion(searches[i].query)) {
      questions = questions + 1;
    }
  }

  return (questions / searches.length) * 100;
}


//if the first word of a search is in the quesiton list then its a question
function looksLikeAQuestion(queryText) {
  const words = normaliseQuery(queryText).trim().split(" ");

  if (words.length === 0) {
    return false;
  }

  for (let i = 0; i < QUESTION_STARTERS.length; i++) {
    if (words[0] === QUESTION_STARTERS[i]) {
      return true;
    }
  }

  return false;
}


//fixing problem searches
function signalTroubleshootShare(searches) {
  if (searches.length === 0) {
    return 0;
  }

  let troubleshooting = 0;

  for (let i = 0; i < searches.length; i++) {
    const text = normaliseQuery(searches[i].query);

    for (let j = 0; j < TROUBLESHOOTING_PHRASES.length; j++) {
      if (text.indexOf(" " + TROUBLESHOOTING_PHRASES[j] + " ") !== -1) {
        troubleshooting = troubleshooting + 1;
        break;
      }
    }
  }

  return (troubleshooting / searches.length) * 100;
}


//how many searches fall in a category
function signalCategoryGroupShare(searches, categoryNames) {
  if (searches.length === 0) {
    return 0;
  }

  let inGroup = 0;

  for (let i = 0; i < searches.length; i++) {
    const category = readCategoryFromRecord(searches[i]);

    for (let j = 0; j < categoryNames.length; j++) {
      if (category === categoryNames[j]) {
        inGroup = inGroup + 1;
        break;
      }
    }
  }

  return (inGroup / searches.length) * 100;
}


//style 
const SEARCH_STYLES = [
  {
    name: "Explorer",
    blurb: "Lots of different topics, and mostly things you hadn't looked up before.",
    signals: ["topicSpread", "newQueries"]
  },
  {
    name: "Researcher",
    blurb: "Fewer topics, gone back to repeatedly - circling the same questions.",
    signals: ["repeatDepth", "narrowFocus"]
  },
  {
    name: "Practical Problem Solver",
    blurb: "A lot of searches about fixing, errors and getting something working.",
    signals: ["troubleshootShare"]
  },
  {
    name: "Entertainment Seeker",
    blurb: "Weighted towards films, games, sport and food.",
    signals: ["leisureShare"]
  },
  {
    name: "Curious Learner",
    blurb: "Lots of questions, and a lean towards learning topics.",
    signals: ["questionShare", "studyShare"]
  }
];


//works out every signal so a style doesnt need to recompute it
function measureAllSignals(searches) {
  const topicSpread = signalTopicSpread(searches);
  const repeatDepth = signalRepeatDepth(searches);

  return {
    topicSpread: topicSpread,
    narrowFocus: 100 - topicSpread,

    repeatDepth: repeatDepth,
    newQueries: 100 - repeatDepth,

    questionShare: signalQuestionShare(searches),
    troubleshootShare: signalTroubleshootShare(searches),

    leisureShare: signalCategoryGroupShare(searches, LEISURE_CATEGORIES),
    studyShare: signalCategoryGroupShare(searches, STUDY_CATEGORIES)
  };
}



function scoreOneStyle(style, signals) {
  let lowest = 100;

  for (let i = 0; i < style.signals.length; i++) {
    const value = signals[style.signals[i]];

    if (value < lowest) {
      lowest = value;
    }
  }

  return Math.round(lowest);
}


//results gives dashboard
function buildSearchStyle(searches) {
  if (searches === undefined || searches === null) {
    return null;
  }

  const recent = keepSearchesBetween(
    searches,
    startOfDaysAgoTimestamp(PROFILE_WINDOW_DAYS - 1),
    Infinity
  );

  if (recent.length < MINIMUM_SEARCHES_FOR_PROFILE) {
    return null;
  }

  const signals = measureAllSignals(recent);

  const scored = [];

  for (let i = 0; i < SEARCH_STYLES.length; i++) {
    scored.push({
      name: SEARCH_STYLES[i].name,
      blurb: SEARCH_STYLES[i].blurb,
      score: scoreOneStyle(SEARCH_STYLES[i], signals)
    });
  }

  scored.sort(function (a, b) {
    return b.score - a.score;
  });

  const winner = scored[0];
  const runnerUp = scored[1];

  //nothing scored high enough
  if (winner.score < MINIMUM_WINNING_SCORE) {
    return {
      name: MIXED_STYLE.name,
      blurb: MIXED_STYLE.blurb,
      score: winner.score,

      runnerUp: { name: runnerUp.name, score: runnerUp.score },

     
      isClose: false,
      isMixed: true,

      evidence: buildEvidenceLines(recent, signals),
      searchesConsidered: recent.length,
      allScores: scored
    };
  }

  return {
    name: winner.name,
    blurb: winner.blurb,
    score: winner.score,

    runnerUp: { name: runnerUp.name, score: runnerUp.score },

    
    isClose: winner.score - runnerUp.score <= CLOSE_SCORE_GAP,
    isMixed: false,

    evidence: buildEvidenceLines(recent, signals),
    searchesConsidered: recent.length,
    allScores: scored
  };
}



function buildEvidenceLines(recent, signals) {
  const ranked = rankCategories(recent);

  const lines = [
    countDistinctCategories(recent) + " different categories",
    uniqueQueryPercent(recent) + "% of searches were ones you hadnt typed before",
    Math.round(signals.questionShare) + "% were phrased as questions",
    Math.round(signals.troubleshootShare) + "% mentioned fixing or errors"
  ];

  if (ranked.length > 0) {
    lines.push("most searched: " + ranked[0].name + " at " + ranked[0].percent + "%");
  }

  return lines;
}


//how many searches are need to meet minimum
function searchesNeededForProfile(searches) {
  if (searches === undefined || searches === null) {
    return MINIMUM_SEARCHES_FOR_PROFILE;
  }

  const recent = keepSearchesBetween(
    searches,
    startOfDaysAgoTimestamp(PROFILE_WINDOW_DAYS - 1),
    Infinity
  );

  const stillNeeded = MINIMUM_SEARCHES_FOR_PROFILE - recent.length;

  if (stillNeeded < 0) {
    return 0;
  }

  return stillNeeded;
}
