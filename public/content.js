chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scraper_job") {

    const executeScrape = async () => {
      try {
        const clickAbleSpans = document.querySelectorAll('span[style*="pointer-events: auto;"]')
        for(const span of  clickAbleSpans) {
          const text = span.innerText.toLowerCase().trim()
          if(text.includes('more') || text.includes('...more')) {
            span.click();
            await new Promise(resolve => setTimeout(resolve, 150))
            break;
          }
        }
        const selectors = {
        title: [
          "[data-sdui-component='com.linkedin.sdui.generated.jobseeker.dsl.impl.aboutTheJob'] span p",
          "[class='_0e93d189 _51b77819']"  
        ],
        company: [
          "[aria-label^='Company, '] a",
          "[aria-label^='Company, ']",
          "[class='fee11784 _20dea5d9 _50ed7e79 _6398628b']"
        ],
        description: [
          "[data-sdui-component='com.linkedin.sdui.generated.jobseeker.dsl.impl.aboutTheJob'] span",
          "[componentKey='JobDetails_AboutTheJob_4437987707'] span",
          "[componentKey='JobDetails_AboutTheJob_4437987707'] p",
          "[class='b532df19 _0f41423d _3b42afd3']"
        ],
      }

      const getText = (selectorList) => {
        for (const selector of selectorList) {
          const element = document.querySelector(selector)
          if (element) {
            return element.innerText.trim();
          }
        }
        return "";
      }

       const jobData = {
        title: getText(selectors.title) || "Unknown Job title",
        company: getText(selectors.company) || "Unknown Company",
        description: getText(selectors.description) || "Unknown Job description",
      }

      if (jobData.description && jobData.description !== "Unknown Job description") {
        sendResponse({ success: true, data: jobData });
      } else {
        sendResponse({ success: false, error: "No job description found" })
      }

      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    }

    executeScrape()
  }

    return true
});
