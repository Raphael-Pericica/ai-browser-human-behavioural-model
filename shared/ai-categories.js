
const AI_TIMEOUT_MILLISECONDS = 8000;

//rules for llm
const AI_SYSTEM_PROMPT =
  "You classify web search queries into exactly one category. " +
  "Answer with the category name only. No explanation, no punctuation. " +
  "If nothing fits well, answer Other.";


//keep a session rebuild is slow
let cachedBaseSession = null;



function aiSessionOptions() {
  return {
    expectedInputs: [{ type: "text", languages: ["en"] }],
    expectedOutputs: [{ type: "text", languages: ["en"] }]
  };
}


//check availability

async function checkAiAvailability() {
  if (typeof LanguageModel === "undefined") {
    return "unsupported";
  }

  try {
    return await LanguageModel.availability(aiSessionOptions());
  } catch (error) {
    //model component is missing .
    console.log("[Search Habits AI] availability() failed:", error.message);
    return "unavailable";
  }
}



//getting a session, return null if model cant be used

async function getBaseSession() {
  if (cachedBaseSession !== null) {
    return cachedBaseSession;
  }

  const availability = await checkAiAvailability();

 
  if (availability !== "available") {
    return null;
  }

  try {
    const options = aiSessionOptions();

    // initial prompt
    
    options.initialPrompts = [
      { role: "system", content: AI_SYSTEM_PROMPT }
    ];

    cachedBaseSession = await LanguageModel.create(options);

    console.log("[Search Habits AI] Local model session ready.");

    return cachedBaseSession;
  } catch (error) {
    console.log("[Search Habits AI] Could not create a model session:", error.message);
    return null;
  }
}



//classify search with ai
async function classifyWithAi(queryText) {
  const baseSession = await getBaseSession();

  if (baseSession === null) {
    return null;
  }

  //clone so the model has no previous memory just the base session with prompt and rules
  let session = null;

  try {
    session = await baseSession.clone();

    //adding a constraint for the model
    const constraint = {
      type: "string",
      enum: allCategoryNames()
    };

    const rawAnswer = await promptWithTimeout(
      session,
      'Search query: "' + queryText + '"',
      constraint
    );

    const categoryName = readCategoryNameFromAnswer(rawAnswer);

    if (categoryName === null) {
      console.log("[Search Habits AI] Unrecognised model answer:", rawAnswer);
      return null;
    }

    return categoryName;
  } catch (error) {
    console.log("[Search Habits AI] Classification failed:", error.message);
    return null;
  } finally {
    //finally runs to clean clone
    if (session !== null) {
      session.destroy();
    }
  }
}


//settles as soon as it runs out of time or recieves an answer, proteciton if service worker stops
function promptWithTimeout(session, promptText, constraint) {
  const theQuestion = session.prompt(promptText, {
    responseConstraint: constraint
  });

  const theTimeout = new Promise(function (resolve, reject) {
    setTimeout(function () {
      reject(new Error("timed out after " + AI_TIMEOUT_MILLISECONDS + "ms"));
    }, AI_TIMEOUT_MILLISECONDS);
  });

  return Promise.race([theQuestion, theTimeout]);
}


//turns answer to plain text 
function readCategoryNameFromAnswer(rawAnswer) {
  if (typeof rawAnswer !== "string") {
    return null;
  }

  let answer = rawAnswer.trim();

  try {
    const parsed = JSON.parse(answer);

    if (typeof parsed === "string") {
      answer = parsed.trim();
    }
  } catch (error) {
    //not json? keep text trim it and match it
  }

  //check if it matches the categories i made then accept
  const knownNames = allCategoryNames();

  for (let i = 0; i < knownNames.length; i++) {
    if (knownNames[i] === answer) {
      return knownNames[i];
    }
  }

  return null;
}
