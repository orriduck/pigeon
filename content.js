// Function to check if the profile indicates hiring
function isHiringProfile() {
  const pageText = document.body.innerText.toLowerCase();
  const hiringKeywords = [
    'hiring',
    'recruiting',
    'looking for',
    'open position',
    'job opening',
    'we\'re hiring',
    'join our team',
    'open role'
  ];

  return hiringKeywords.some(keyword => pageText.includes(keyword));
}

// Check if we're on a LinkedIn profile page
if (window.location.href.includes('linkedin.com/in/')) {
  // If hiring indicators are found, notify the extension
  if (isHiringProfile()) {
    chrome.runtime.sendMessage({ type: 'HIRING_DETECTED' });
  }
}
