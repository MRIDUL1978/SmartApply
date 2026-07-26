// console.log("Smart Apply Scraper Loaded");

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "scraper_job") {
//     const selectors = {
//       title: [
//         "ember-view h1",
//         "h1",
//         ".top-card-layout__title",
//       ],
//       company: [
//         "[class='ember-view link-without-visited-state inline-block t-black']",
//         "job-details-jobs-unified-top-card__company-name",
//       ],
//       description: [
//         ".jobs-description__content",
//         ".jobs-description-content",
//         "#job-details",
//         ".description__text",
//       ],
//     };

//     const getText = (selectorList) => {
//       for (const selector of selectorList) {
//         const element = document.querySelector(selector);
//         if (element) {
//           return element.innerText.trim();
//         }
//       }
//       return "";
//     };

//     const jobData = {
//       title: getText(selectors.title) || "Unknown Job title",
//       company: getText(selectors.company) || "Unknown Company",
//       description: getText(selectors.description) || "Unknown Job description",
//     };

//     console.log("Scraped Data", jobData);

//     if (jobData.description) {
//       sendResponse({ success: true, data: jobData });
//     } else {
//       sendResponse({ success: false, error: "No job description found" });
//     }
//   }

//   return true;
// });
