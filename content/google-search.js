
const SEARCH_MESSAGE_TYPE = "SEARCH_DETECTED";


//return if q is null
function readSearchQueryFromAddress() {
  const addressParameters = new URLSearchParams(window.location.search);
  return addressParameters.get("q");
}


//milliseconds
function buildSearchRecord(queryText) {
  return {
    query: queryText,
    timestamp: Date.now()
  };
}


//continue with no reply and hand google a function to execute once repply is received
function sendRecordToBackOffice(searchRecord) {
  const message = {
    type: SEARCH_MESSAGE_TYPE,
    record: searchRecord
  };

  chrome.runtime.sendMessage(message, function (reply) {
   
    //error
    
    if (chrome.runtime.lastError) {
      console.log("[Search Habits AI] Could not reach the service worker:",
                  chrome.runtime.lastError.message);
      return;
    }

    console.log("[Search Habits AI] Service worker replied:", reply);
  });

  
  console.log("[Search Habits AI] Message sent, not waiting for a reply.");
}



function detectSearchOnThisPage() {
  const rawQuery = readSearchQueryFromAddress();


  if (rawQuery === null) {
    return;
  }

  //get rid of white spaces with trim

  const query = rawQuery.trim();

  if (query === "") {
    return;
  }

  const searchRecord = buildSearchRecord(query);

  console.log("[Search Habits AI] Search detected:", searchRecord.query);

  sendRecordToBackOffice(searchRecord);


}



detectSearchOnThisPage();


