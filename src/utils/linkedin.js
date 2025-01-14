export async function checkIfHiring(tab) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const profileText = document.body.innerText.toLowerCase();
        const hiringKeywords = [
          'hiring',
          'recruiting',
          'looking for',
          'open position',
          'open role',
          'job opening',
          'we\'re growing',
          'join our team',
          'career opportunity'
        ];
        
        const isHiring = hiringKeywords.some(keyword => profileText.includes(keyword));
        const hasJobPosts = document.querySelector('[data-test-id="jobs-tab"]') !== null;
        
        return isHiring || hasJobPosts;
      }
    });
    
    return results[0].result;
  } catch (error) {
    console.error('Error checking hiring status:', error);
    throw error;
  }
}

export async function validatePositionLink(url) {
  try {
    const tab = await chrome.tabs.create({ url, active: false });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent.trim();
        const company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent.trim();
        
        return title && company ? { title, company } : null;
      }
    });
    
    chrome.tabs.remove(tab.id);
    return results[0].result;
  } catch (error) {
    console.error('Error validating job posting:', error);
    return null;
  }
}

export function openLinkedIn() {
  chrome.tabs.create({ url: 'https://www.linkedin.com' });
}

/**
 * Parse LinkedIn profile data from the current page
 * @returns {Promise<{name: string, position: string, isHiring: boolean}>}
 */
async function parseLinkedInProfile() {
  console.log('\n=== LinkedIn Profile Parsing ===');
  try {
    // Execute script in the active tab to get profile data
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Parsing tab:', {
      id: tab?.id,
      url: tab?.url,
      title: tab?.title
    });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        console.log('Starting DOM parsing...');
        
        // Get name - try multiple selectors based on the HTML structure
        const nameSelectors = [
          'h1.break-words',
          '.artdeco-hoverable-trigger h1',
          '[class*="break-words"] h1',
          'h1.text-heading-xlarge',
          'h1.inline.t-24.t-black.t-normal.break-words',
          '.pv-text-details__left-panel h1'
        ];
        
        console.log('Trying name selectors:', nameSelectors);
        
        let name = '';
        for (const selector of nameSelectors) {
          const el = document.querySelector(selector);
          console.log(`Selector "${selector}":`, el?.textContent?.trim() || 'Not found');
          if (el?.textContent) {
            name = el.textContent.trim();
            break;
          }
        }
        console.log('Final name:', name);

        // Get current position - try multiple selectors
        const positionSelectors = [
          '[class*="text-body-medium"]',
          '[class*="break-words"][class*="text-body"]',
          'div.text-body-medium.break-words',
          '.pv-text-details__left-panel .text-body-medium',
          'div[aria-label="Current company"]',
          '.pv-text-details__right-panel .text-body-small.text-color-text-secondary'
        ];
        
        console.log('Trying position selectors:', positionSelectors);
        
        let position = '';
        for (const selector of positionSelectors) {
          const el = document.querySelector(selector);
          console.log(`Selector "${selector}":`, el?.textContent?.trim() || 'Not found');
          if (el?.textContent) {
            const text = el.textContent.trim();
            // Skip if it's just a number (like connection count)
            if (!text.match(/^\d+/)) {
              position = text;
              break;
            }
          }
        }
        console.log('Final position:', position);

        // Check if person is hiring - more comprehensive check
        console.log('Checking if person is hiring...');
        const isHiring = (() => {
          // Check for hiring badge in profile picture
          const hiringBadgeSelectors = [
            '.hiring-badge',
            '[class*="hiring-badge"]',
            '.pv-top-card-profile-picture__container .member-36',
            'img[alt*="#HIRING"]',
            '.pv-top-card__photo-wrapper [class*="member"]'
          ];
          
          const hasHiringBadge = hiringBadgeSelectors.some(selector => {
            const found = document.querySelector(selector) !== null;
            console.log(`Hiring badge selector "${selector}":`, found);
            return found;
          });
          console.log('Has hiring badge UI element:', hasHiringBadge);

          // Check for "Hiring" text in the profile header or title
          const headerText = [
            document.querySelector('.pv-text-details__left-panel')?.textContent || '',
            document.querySelector('.top-card-layout__headline')?.textContent || '',
            document.querySelector('.profile-topcard-person-entity__content')?.textContent || '',
            document.title || ''
          ].join(' ').toLowerCase();
          
          const hasHiringInHeader = headerText.includes('hiring');
          console.log('Has hiring in header:', hasHiringInHeader);

          // Check for "Open to work" badge
          const openToWorkSelectors = [
            '[class*="open-to-work-badge"]',
            '.pv-top-card--open-to-work-badge',
            '.profile-topcard__open-to-work-badge'
          ];
          
          const hasOpenToWork = openToWorkSelectors.some(selector => {
            const found = document.querySelector(selector) !== null;
            console.log(`Open to work selector "${selector}":`, found);
            return found;
          });
          console.log('Has open to work badge:', hasOpenToWork);

          // Check for hiring section
          const hasHiringSection = document.querySelector('[data-test-id*="hiring"]') !== null ||
                          document.querySelector('[data-control-name*="hiring"]') !== null;
          console.log('Has hiring section:', hasHiringSection);

          // Final hiring check
          const finalResult = hasHiringBadge || hasHiringInHeader || hasOpenToWork || hasHiringSection;
          console.log('Final hiring check result:', finalResult);
          return finalResult;
        })();
        
        const result = { name, position, isHiring };
        console.log('Final parsed data:', result);
        return result;
      }
    });

    const profileData = results[0].result;
    console.log('Profile data from page:', profileData);
    console.log('=== End LinkedIn Profile Parsing ===\n');
    
    return profileData;
  } catch (error) {
    console.error('Error parsing LinkedIn profile:', error);
    console.log('=== End LinkedIn Profile Parsing (with error) ===\n');
    return { name: '', position: '', isHiring: false };
  }
}

export { parseLinkedInProfile };
