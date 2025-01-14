// Import LinkedIn utilities
import { parseLinkedInProfile } from '/src/utils/linkedin.js';

// DOM Elements
const screens = {
  loading: document.getElementById('loading-screen'),
  setup: document.getElementById('setup-screen'),
  success: document.getElementById('success-screen'),
  linkedinProfile: document.getElementById('linkedin-profile-screen')
};

const loadingText = document.getElementById('loading-text');

const buttons = {
  saveSettings: document.getElementById('save-settings'),
  openLinkedIn: document.getElementById('open-linkedin'),
  startOver: document.getElementById('start-over'),
  referral: document.getElementById('referral-btn'),
  meeting: document.getElementById('meeting-btn'),
  copyMessage: document.getElementById('copy-message'),
  regenerate: document.getElementById('regenerate')
};

const inputs = {
  resume: document.getElementById('resume'),
  apiKey: document.getElementById('api-key'),
  message: document.getElementById('message')
};

const sections = {
  notHiring: document.getElementById('not-hiring'),
  hiringOptions: document.getElementById('hiring-options'),
  message: document.getElementById('message-section')
};

const profileElements = {
  name: document.getElementById('profile-name'),
  position: document.getElementById('profile-position')
};

// Helper Functions
function showScreen(screenName) {
  console.log('Showing screen:', screenName);
  Object.values(screens).forEach(screen => {
    screen.classList.remove('active');
  });
  screens[screenName].classList.add('active');
}

function showSection(section, show = true) {
  console.log('Toggling section visibility:', { section: section.id, show });
  section.classList.toggle('hidden', !show);
}

function setLoadingText(text) {
  console.log('Setting loading text:', text);
  if (loadingText) {
    loadingText.textContent = text;
  }
}

async function getCurrentTab() {
  console.log('Getting current tab...');
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Current tab:', tabs[0]);
    return tabs[0];
  } catch (error) {
    console.error('Error getting current tab:', error);
    return null;
  }
}

// Check if URL is a LinkedIn profile
function isLinkedInProfile(url) {
  console.log('=== URL Check ===');
  console.log('Checking URL:', url);
  
  if (!url) {
    console.log('URL is empty or undefined');
    return false;
  }

  try {
    const urlObj = new URL(url);
    console.log('Domain:', urlObj.hostname);
    console.log('Path:', urlObj.pathname);
    
    const isLinkedIn = urlObj.hostname.includes('linkedin.com');
    const isProfilePath = urlObj.pathname.startsWith('/in/');
    
    console.log('Is LinkedIn domain?', isLinkedIn);
    console.log('Is profile path?', isProfilePath);
    
    const isProfile = isLinkedIn && isProfilePath;
    console.log('Final result: Is LinkedIn Profile?', isProfile);
    console.log('===============');
    
    return isProfile;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return false;
  }
}

// Check current page and show appropriate screen
async function checkCurrentPage() {
  console.log('\n=== Page Check ===');
  console.log('Starting page check at:', new Date().toISOString());
  let currentTab = null;
  
  try {
    const data = await chrome.storage.local.get(['resume', 'apiKey']);
    if (!data.resume || !data.apiKey) {
      console.log('No settings found, showing setup screen');
      showScreen('setup');
      return;
    }

    currentTab = await getCurrentTab();
    console.log('Current tab:', {
      id: currentTab?.id,
      url: currentTab?.url,
      title: currentTab?.title
    });

    if (!currentTab?.url) {
      console.log('No active tab or URL');
      showScreen('success');
      return;
    }

    // If we're already checking this URL, skip
    if (currentTab.url === lastCheckedUrl) {
      console.log('URL already being checked:', currentTab.url);
      return;
    }

    lastCheckedUrl = currentTab.url;
    console.log('Setting last checked URL to:', lastCheckedUrl);
    
    showScreen('loading');
    setLoadingText('Analyzing LinkedIn profile...');

    const isProfile = isLinkedInProfile(currentTab.url);
    console.log('URL check result:', isProfile);

    if (isProfile) {
      console.log('LinkedIn profile detected, parsing data...');
      
      // Get profile data from LinkedIn page
      const profileData = await parseLinkedInProfile();
      console.log('Parsed profile data:', profileData);
      
      if (!profileData.name) {
        console.log('No profile data found, showing success screen');
        showScreen('success');
        return;
      }
      
      // Update UI with profile data
      profileElements.name.textContent = profileData.name;
      profileElements.position.textContent = profileData.position;
      
      // Show/hide hiring sections based on profile data
      showSection(sections.notHiring, !profileData.isHiring);
      showSection(sections.hiringOptions, profileData.isHiring);
      
      console.log('Successfully updated UI with profile data');
      showScreen('linkedinProfile');
    } else {
      console.log('Not a LinkedIn profile, showing success screen');
      showScreen('success');
    }
  } catch (error) {
    console.error('Error checking current page:', error);
    showScreen('setup');
  } finally {
    // Clear the last checked URL after a delay
    setTimeout(() => {
      if (lastCheckedUrl === currentTab?.url) {
        console.log('Clearing last checked URL:', lastCheckedUrl);
        lastCheckedUrl = null;
      }
    }, 1000);
    console.log('=== End Page Check ===\n');
  }
}

// Event Handlers
async function handleSaveSettings() {
  console.log('Saving settings...');
  const resume = inputs.resume.files[0];
  const apiKey = inputs.apiKey.value;

  if (!resume || !apiKey) {
    alert('Please provide both a resume and an API key');
    return;
  }

  if (!apiKey.startsWith('sk-')) {
    alert('Please enter a valid OpenAI API key');
    return;
  }

  showScreen('loading');
  setLoadingText('Saving your settings...');

  const reader = new FileReader();
  reader.onload = async (e) => {
    const resumeContent = e.target.result;
    try {
      await chrome.storage.local.set({
        resume: resumeContent,
        apiKey: apiKey
      });
      console.log('Settings saved successfully');
      checkCurrentPage();
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving your information. Please try again.');
      showScreen('setup');
    }
  };
  reader.readAsText(resume);
}

async function handleStartOver() {
  console.log('Starting over...');
  try {
    showScreen('loading');
    setLoadingText('Clearing your settings...');
    await chrome.storage.local.clear();
    inputs.resume.value = '';
    inputs.apiKey.value = '';
    showScreen('setup');
  } catch (error) {
    console.error('Error clearing data:', error);
    alert('Error clearing your information. Please try again.');
  }
}

function handleOpenLinkedIn() {
  console.log('Opening LinkedIn...');
  chrome.tabs.create({ url: 'https://www.linkedin.com/jobs' });
}

async function generateMessage(type) {
  console.log('Generating message:', type);
  showSection(sections.message, true);
  inputs.message.value = 'Generating message...';
  inputs.message.disabled = true;

  try {
    // TODO: Implement actual message generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    inputs.message.value = type === 'referral' 
      ? 'Sample referral request message...'
      : 'Sample meeting request message...';
  } catch (error) {
    console.error('Error generating message:', error);
    inputs.message.value = 'Error generating message. Please try again.';
  } finally {
    inputs.message.disabled = false;
  }
}

async function copyMessageToClipboard() {
  console.log('Copying message to clipboard...');
  try {
    await navigator.clipboard.writeText(inputs.message.value);
    const originalText = buttons.copyMessage.textContent;
    buttons.copyMessage.textContent = 'Copied!';
    setTimeout(() => {
      buttons.copyMessage.textContent = originalText;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
}

let lastCheckedUrl = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded');
  // Check current page on load
  checkCurrentPage();

  // Add event listeners
  buttons.saveSettings?.addEventListener('click', handleSaveSettings);
  buttons.startOver?.addEventListener('click', handleStartOver);
  buttons.openLinkedIn?.addEventListener('click', handleOpenLinkedIn);
  
  buttons.referral?.addEventListener('click', () => generateMessage('referral'));
  buttons.meeting?.addEventListener('click', () => generateMessage('meeting'));
  
  buttons.copyMessage?.addEventListener('click', copyMessageToClipboard);
  buttons.regenerate?.addEventListener('click', () => {
    const messageType = sections.message.dataset.type;
    generateMessage(messageType);
  });

  // Listen for tab URL changes
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('Tab updated:', { tabId, changeInfo, tab });
    if (changeInfo.status === 'complete') {
      checkCurrentPage();
    }
  });

  // Listen for tab activation changes
  chrome.tabs.onActivated.addListener((activeInfo) => {
    console.log('Tab activated:', activeInfo);
    checkCurrentPage();
  });
});
