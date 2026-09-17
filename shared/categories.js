//file shared wtih backend and popup


//no match
const CATEGORY_OTHER = "Other";

//no match before implementation
const CATEGORY_UNKNOWN = "Uncategorised";


//cats
const CATEGORIES = [
  {
    name: "Programming",
    keywords: [
      "javascript", "python", "java", "html", "css", "sql", "typescript",
      "react", "node", "git", "github", "api", "function", "array", "regex",
      "compiler", "debug", "debugging", "syntax", "algorithm", "recursion",
      "code", "coding", "programming", "developer", "npm", "stack overflow",
      "variable", "boolean", "linked list", "runtime error", "null pointer"
    ]
  },
  {
    name: "Technology",
    keywords: [
      "laptop", "cpu", "gpu", "ram", "ssd", "motherboard", "windows", "linux",
      "macos", "android", "ios", "iphone", "samsung", "router", "wifi",
      "bluetooth", "driver", "software", "hardware", "computer", "monitor",
      "keyboard", "headphones", "usb", "battery life", "operating system"
    ]
  },
  {
    name: "Gaming",
    keywords: [
      "game", "games", "gaming", "xbox", "playstation", "ps5", "nintendo",
      "switch", "steam", "minecraft", "fortnite", "valorant", "league of legends",
      "speedrun", "walkthrough", "boss fight", "dlc", "fps", "rpg", "twitch"
    ]
  },
  {
    name: "Education",
    keywords: [
      "university", "college", "course", "lecture", "exam", "revision",
      "assignment", "homework", "essay", "thesis", "dissertation", "study",
      "studying", "textbook", "syllabus", "semester",
      "scholarship", "cao", "leaving cert", "gpa", "module"
    ]
  },
  {
    name: "Health",
    keywords: [
      "symptoms", "doctor", "gp", "pharmacy", "medicine", "dosage", "vitamin",
      "diet", "exercise", "workout", "gym", "sleep", "anxiety", "stress",
      "headache", "flu", "vaccine", "mental health", "physiotherapy", "injury"
    ]
  },
  {
    name: "Finance",
    keywords: [
      "bank", "mortgage", "loan", "interest rate", "tax", "salary", "invoice",
      "invest", "investing", "stocks", "shares", "crypto", "bitcoin", "pension",
      "savings", "budget", "insurance", "revenue", "credit card", "exchange rate"
    ]
  },
  {
    name: "Travel",
    keywords: [
      "flights", "flight", "hotel", "hostel", "airbnb", "airport", "visa",
      "passport", "train", "bus", "ferry", "holiday", "vacation", "itinerary",
      "ryanair", "aer lingus", "things to do in", "car hire", "tokyo", "paris",
      "barcelona", "amsterdam"
    ]
  },
  {
    name: "Food",
    keywords: [
      "recipe", "recipes", "cook", "cooking", "bake", "baking", "restaurant",
      "takeaway", "menu", "ingredients", "dinner", "lunch", "breakfast",
      "vegan", "vegetarian", "pasta", "chicken", "curry", "calories", "air fryer"
    ]
  },
  {
    name: "Shopping",
    keywords: [
      "buy", "price", "cheap", "cheapest", "deal", "deals", "discount", "sale",
      "amazon", "ebay", "review", "reviews", "best value", "coupon", "delivery",
      "refund", "return policy", "black friday", "vs", "worth it"
    ]
  },
  {
    name: "Sports",
    keywords: [
      "football", "soccer", "rugby", "hurling", "gaa", "premier league",
      "champions league", "match", "fixtures", "score", "scores", "league table",
      "f1", "formula 1", "tennis", "golf", "boxing", "ufc", "olympics", "transfer news"
    ]
  },
  {
    name: "Entertainment",
    keywords: [
      "movie", "movies", "film", "netflix", "disney", "series", "season",
      "episode", "trailer", "cast", "actor", "actress", "music", "song",
      "album", "spotify", "concert", "lyrics", "imdb", "streaming"
    ]
  },
  {
    name: "News",
    keywords: [
      "news", "election", "government", "minister", "taoiseach", "president",
      "parliament", "dail", "protest", "war", "court", "trial", "policy",
      "budget 2026", "weather warning", "strike", "headlines", "breaking"
    ]
  }
];


//tidy and normalise text
function normaliseQuery(queryText) {
  const lowercase = queryText.toLowerCase();
  const lettersAndDigitsOnly = lowercase.replace(/[^a-z0-9]+/g, " ");

  return " " + lettersAndDigitsOnly.trim() + " ";
}

//counter plus add white space
function countKeywordMatches(normalisedText, keywords) {
  let howManyMatched = 0;

  for (let i = 0; i < keywords.length; i++) {
    const paddedKeyword = " " + keywords[i] + " ";

    // indexOf gives the position of the first match, or -1 if there is none.
    if (normalisedText.indexOf(paddedKeyword) !== -1) {
      howManyMatched = howManyMatched + 1;
    }
  }

  return howManyMatched;
}


//gives back best match category
function classifySearchQuery(queryText) {
  if (typeof queryText !== "string" || queryText.trim() === "") {
    return CATEGORY_OTHER;
  }

  const normalisedText = normaliseQuery(queryText);

  let bestCategoryName = CATEGORY_OTHER;
  let bestScore = 0;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const category = CATEGORIES[i];
    const score = countKeywordMatches(normalisedText, category.keywords);

    
    if (score > bestScore) {
      bestScore = score;
      bestCategoryName = category.name;
    }
  }

  return bestCategoryName;
}


//reads category from stored record
function readCategoryFromRecord(record) {
  if (record.category === undefined) {
    return CATEGORY_UNKNOWN;
  }

  return record.category;
}
