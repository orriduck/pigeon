// Import LinkedIn utilities
import { parseLinkedInProfile } from '/src/utils/linkedin.js';

// DOM Elements
const screens = {
  setup: document.getElementById('setup'),
  loading: document.getElementById('loading'),
  success: document.getElementById('success'),
  linkedinProfile: document.getElementById('linkedinProfile')
};

const loadingText = document.getElementById('loadingText');

const buttons = {
  saveSettings: document.getElementById('saveSettings'),
  openLinkedIn: document.getElementById('openLinkedIn'),
  startOver: document.getElementById('startOver'),
  referral: document.getElementById('referralBtn'),
  meeting: document.getElementById('meetingBtn'),
  connect: document.getElementById('connectBtn'),
  copyMessage: document.getElementById('copyMessage'),
  regenerate: document.getElementById('regenerate'),
  continueBrowsing: document.getElementById('continueBrowsing')
};

const inputs = {
  resume: document.getElementById('resume'),
  apiKey: document.getElementById('apiKey'),
  message: document.getElementById('message')
};

const sections = {
  notHiring: document.getElementById('notHiring'),
  hiringOptions: document.getElementById('hiringOptions'),
  message: document.getElementById('messageSection')
};

const profileElements = {
  name: document.getElementById('profileName'),
  position: document.getElementById('profilePosition'),
  hiringBadge: document.getElementById('hiringBadge')
};

// Helper Functions
function showScreen(screenName) {
  Object.entries(screens).forEach(([name, element]) => {
    if (element) {
      element.style.display = name === screenName ? 'block' : 'none';
    } else {
      console.warn(`Screen element "${name}" not found`);
    }
  });
}

function showSection(section, show) {
  if (section) {
    section.classList.toggle('hidden', !show);
  } else {
    console.warn('Section element not found');
  }
}

function setLoadingText(text) {
  if (loadingText) {
    loadingText.textContent = text;
  }
}

async function getCurrentTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  } catch (error) {
    console.error('Error getting current tab:', error);
    return null;
  }
}

// Check if URL is a LinkedIn profile
function isLinkedInProfile(url) {
  if (!url) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const isLinkedIn = urlObj.hostname.includes('linkedin.com');
    const isProfilePath = urlObj.pathname.startsWith('/in/');
    return isLinkedIn && isProfilePath;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return false;
  }
}

// Update UI with profile data
function updateProfileUI(profileData) {
  if (!profileData) {
    console.warn('No profile data provided');
    return;
  }

  // Update name and position
  if (profileElements.name) {
    profileElements.name.textContent = profileData.name || 'Unknown';
  }
  
  if (profileElements.position) {
    profileElements.position.textContent = profileData.position || 'No position listed';
  }
  
  // Update hiring badge visibility
  if (profileElements.hiringBadge) {
    profileElements.hiringBadge.classList.toggle('visible', profileData.isHiring);
  }
  
  // Always show message options, but update the text based on hiring status
  if (sections.notHiring && sections.hiringOptions) {
    sections.notHiring.classList.toggle('hidden', profileData.isHiring);
    sections.hiringOptions.classList.toggle('hidden', !profileData.isHiring);
  }
}

// Check current page and show appropriate screen
async function checkCurrentPage() {
  let currentTab = null;
  
  try {
    const data = await chrome.storage.local.get(['resume', 'apiKey']);
    if (!data.resume || !data.apiKey) {
      showScreen('setup');
      return;
    }

    currentTab = await getCurrentTab();

    if (!currentTab?.url) {
      showScreen('success');
      return;
    }

    // If we're already checking this URL, skip
    if (currentTab.url === lastCheckedUrl) {
      return;
    }

    lastCheckedUrl = currentTab.url;
    
    showScreen('loading');
    setLoadingText('Analyzing LinkedIn profile...');

    const isProfile = isLinkedInProfile(currentTab.url);

    if (isProfile) {
      console.log('LinkedIn profile detected, parsing data...');
      
      // Get profile data from LinkedIn page
      const profileData = await parseLinkedInProfile();
      
      if (!profileData.name) {
        showScreen('success');
        return;
      }
      
      // Update UI with profile data
      updateProfileUI(profileData);
      showScreen('linkedinProfile');
      
    } else {
      showScreen('success');
    }
  } catch (error) {
    console.error('Error checking current page:', error);
    showScreen('setup');
  } finally {
    // Clear the last checked URL after a delay
    setTimeout(() => {
      if (lastCheckedUrl === currentTab?.url) {
        lastCheckedUrl = null;
      }
    }, 1000);
  }
}

// Event Handlers
async function handleSaveSettings() {
  console.log('Saving settings...');
  showScreen('loading');
  
  const resume = inputs.resume?.files[0];
  const apiKey = inputs.apiKey?.value?.trim();
  
  if (!resume || !apiKey) {
    console.warn('Missing required fields');
    return;
  }

  try {
    // Save settings to chrome storage
    await chrome.storage.local.set({
      apiKey: apiKey,
      hasSetup: true
    });
    
    console.log('Settings saved successfully');
    showScreen('success');
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Error saving settings. Please try again.');
    showScreen('setup');
  }
}

async function handleStartOver() {
  console.log('Starting over...');
  try {
    await chrome.storage.local.clear();
    console.log('Storage cleared');
    showScreen('setup');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}

async function handleOpenLinkedIn() {
  console.log('Opening LinkedIn...');
  try {
    await chrome.tabs.create({ url: 'https://www.linkedin.com/jobs' });
    console.log('LinkedIn opened in new tab');
  } catch (error) {
    console.error('Error opening LinkedIn:', error);
  }
}

// Message generation
async function generateMessage(type) {
  if (!sections.message || !inputs.message) return;

  sections.message.dataset.messageType = type;
  showSection(sections.message, true);
  inputs.message.value = '🤖 Generating your message...';
  
  try {
    // Get profile data from LinkedIn parsing
    const profileData = await parseLinkedInProfile();
    console.log('Profile data for message:', profileData);

    if (!profileData || !profileData.name) {
      throw new Error('Could not get profile data from LinkedIn');
    }

    // Get stored resume content
    const { resume, apiKey } = await chrome.storage.local.get(['resume', 'apiKey']);

    if (!resume || !apiKey) {
      throw new Error('Please set up your resume and API key in the extension settings');
    }

    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid API key format. Please check your OpenAI API key');
    }

    // Extract key information from resume
    const resumeExcerpt = resume.length > 1000 ? 
      resume.substring(0, 1000) + '...' : 
      resume;

    // Create context object for better prompt engineering
    const context = {
      target: {
        name: profileData.name,
        title: profileData.position?.split(' at ')?.[0]?.trim() || '',
        company: profileData.position?.split(' at ')?.[1]?.trim() || '',
        fullPosition: profileData.position,
        isHiring: profileData.isHiring,
        // Add any other relevant data from profileData
        location: profileData.location,
        connectionDegree: profileData.connectionDegree,
        openToWork: profileData.openToWork
      },
      sender: {
        resume: resumeExcerpt
      },
      messageType: type
    };

    // Prepare prompt based on message type and context
    const systemPrompt = `You are a professional networking assistant helping to write a LinkedIn message.
Target Info:
- Name: ${context.target.name}
- Position: ${context.target.fullPosition}
- Company: ${context.target.company}
- Location: ${context.target.location || 'Unknown'}
- Connection: ${context.target.connectionDegree || '2nd'} degree
${context.target.isHiring ? "- Currently Hiring" : ""}
${context.target.openToWork ? "- Open to Work" : ""}

Your task is to write a concise, personalized message (max 300 characters) that:
1. References the recipient's current role and company
2. Mentions relevant experience from the sender's background that aligns with their profile
3. Makes a clear, specific request (${type})
4. Maintains a professional but friendly tone
5. If they're hiring, mention relevant skills for their open roles

Sender's Background:
${context.sender.resume}`;

    const userPrompts = {
      referral: `Write a message asking ${context.target.name} for a referral at ${context.target.company}, highlighting relevant experience for their company.`,
      meeting: `Write a message requesting a brief meeting with ${context.target.name} to learn more about their work at ${context.target.company}.`,
      connect: `Write a message to connect with ${context.target.name}, focusing on shared professional interests and their work at ${context.target.company}.`
    };

    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompts[type]
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.error?.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing status at https://platform.openai.com/account/billing');
      } else if (errorData.error?.code === 'invalid_api_key') {
        throw new Error('Invalid API key. Please check your API key at https://platform.openai.com/api-keys');
      } else if (errorData.error?.message) {
        throw new Error(`OpenAI API Error: ${errorData.error.message}`);
      } else {
        throw new Error('Failed to generate message. Please try again.');
      }
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI API');
    }

    const generatedMessage = data.choices[0].message.content.trim();
    inputs.message.value = generatedMessage;

  } catch (error) {
    console.error('Error:', error.message);
    inputs.message.value = `Error: ${error.message}`;
    
    if (error.message.includes('quota exceeded')) {
      alert('Your OpenAI API key has exceeded its quota. Please check your billing status at https://platform.openai.com/account/billing');
    } else if (error.message.includes('API key')) {
      alert('Please check your OpenAI API key in the extension settings.');
    } else if (error.message.includes('resume')) {
      alert('Please upload your resume in the extension settings.');
    } else {
      alert('Failed to generate message. Please try again.');
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded, initializing event listeners...');
  
  // Setup screen buttons
  if (buttons.saveSettings) {
    buttons.saveSettings.addEventListener('click', async () => {
      console.log('Save settings clicked');
      const resume = inputs.resume?.files[0];
      const apiKey = inputs.apiKey?.value?.trim();
      
      if (!resume || !apiKey) {
        alert('Please provide both a resume and an API key');
        return;
      }

      showScreen('loading');
      
      try {
        // Read resume file
        const resumeText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(resume);
        });

        // Save to storage
        await chrome.storage.local.set({
          resume: resumeText,
          apiKey: apiKey,
          hasSetup: true
        });
        
        console.log('Settings saved successfully');
        showScreen('success');
      } catch (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings. Please try again.');
        showScreen('setup');
      }
    });
  }

  // Success screen buttons
  if (buttons.openLinkedIn) {
    buttons.openLinkedIn.addEventListener('click', () => {
      console.log('Open LinkedIn clicked');
      handleOpenLinkedIn();
    });
  }

  if (buttons.startOver) {
    buttons.startOver.addEventListener('click', () => {
      console.log('Start over clicked');
      handleStartOver();
    });
  }

  // LinkedIn profile screen buttons
  if (buttons.referral) {
    buttons.referral.addEventListener('click', () => {
      console.log('Referral button clicked');
      generateMessage('referral');
    });
  }

  if (buttons.meeting) {
    buttons.meeting.addEventListener('click', () => {
      console.log('Meeting button clicked');
      generateMessage('meeting');
    });
  }

  if (buttons.connect) {
    buttons.connect.addEventListener('click', () => {
      console.log('Connect button clicked');
      generateMessage('connect');
    });
  }

  if (buttons.copyMessage) {
    buttons.copyMessage.addEventListener('click', async () => {
      console.log('Copy message clicked');
      const message = inputs.message?.value;
      if (message) {
        try {
          await navigator.clipboard.writeText(message);
          buttons.copyMessage.textContent = 'Copied!';
          setTimeout(() => {
            buttons.copyMessage.textContent = 'Copy to Clipboard';
          }, 2000);
        } catch (error) {
          console.error('Failed to copy message:', error);
        }
      }
    });
  }

  if (buttons.regenerate) {
    buttons.regenerate.addEventListener('click', () => {
      console.log('Regenerate clicked');
      const messageType = sections.message?.dataset.messageType;
      if (messageType) {
        generateMessage(messageType);
      } else {
        console.warn('No message type found');
      }
    });
  }

  // Check initial state
  chrome.storage.local.get(['hasSetup'], (result) => {
    const initialScreen = result.hasSetup ? 'linkedinProfile' : 'setup';
    console.log('Initial screen:', initialScreen);
    showScreen(initialScreen);
  });

  // Listen for tab updates
  chrome.tabs.onActivated.addListener(activeInfo => {
    console.log('Tab activated:', activeInfo);
    checkCurrentPage();
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('Tab updated:', { tabId, changeInfo, tab });
    if (changeInfo.status === 'complete') {
      checkCurrentPage();
    }
  });
});

let lastCheckedUrl = null;
