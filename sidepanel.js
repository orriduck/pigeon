document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const setupScreen = document.getElementById('setup-screen');
  const successScreen = document.getElementById('success-screen');
  const messageScreen = document.getElementById('message-screen');
  const referralForm = document.getElementById('referral-form');
  const messageEditor = document.getElementById('message-editor');
  
  // Check if setup is completed
  chrome.storage.local.get(['resume', 'apiKey'], (result) => {
    if (result.resume && result.apiKey) {
      setupScreen.classList.remove('active');
      messageScreen.classList.add('active');
    }
  });

  // Setup form submission
  document.getElementById('save-setup').addEventListener('click', async () => {
    const resumeFile = document.getElementById('resume').files[0];
    const apiKey = document.getElementById('api-key').value;

    if (!resumeFile || !apiKey) {
      alert('Please fill in all fields');
      return;
    }

    // Verify API key format
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      alert('Please enter a valid OpenAI API key');
      return;
    }

    // Convert resume to text using FileReader
    const reader = new FileReader();
    reader.onload = async (e) => {
      const resumeContent = e.target.result;
      
      try {
        // Save to chrome storage (local only)
        await chrome.storage.local.set({
          resume: resumeContent,
          apiKey: apiKey,
          timestamp: Date.now() // Add timestamp for reference
        });

        setupScreen.classList.remove('active');
        successScreen.classList.add('active');
        
        // Show message screen after 2 seconds
        setTimeout(() => {
          successScreen.classList.remove('active');
          messageScreen.classList.add('active');
        }, 2000);
      } catch (error) {
        console.error('Error saving to local storage:', error);
        alert('Error saving your information. Please try again.');
      }
    };
    
    reader.readAsText(resumeFile);
  });

  // Message type selection
  document.getElementById('referral-btn').addEventListener('click', () => {
    referralForm.classList.remove('hidden');
    messageEditor.classList.add('hidden');
    
    // Add selected state to button
    document.getElementById('referral-btn').classList.add('border-blue-500', 'bg-blue-50');
    document.getElementById('meeting-btn').classList.remove('border-blue-500', 'bg-blue-50');
  });

  document.getElementById('meeting-btn').addEventListener('click', async () => {
    referralForm.classList.add('hidden');
    messageEditor.classList.remove('hidden');
    
    // Add selected state to button
    document.getElementById('meeting-btn').classList.add('border-blue-500', 'bg-blue-50');
    document.getElementById('referral-btn').classList.remove('border-blue-500', 'bg-blue-50');
    
    // Generate meeting request message
    const message = await generateMessage('meeting');
    document.getElementById('message-content').value = message;
  });

  // Generate referral message
  document.getElementById('generate-referral').addEventListener('click', async () => {
    const positionLink = document.getElementById('position-link').value;
    if (!positionLink) {
      alert('Please enter the position link');
      return;
    }

    messageEditor.classList.remove('hidden');
    const message = await generateMessage('referral', positionLink);
    document.getElementById('message-content').value = message;
  });

  // Copy message to clipboard
  document.getElementById('copy-message').addEventListener('click', () => {
    const messageContent = document.getElementById('message-content').value;
    navigator.clipboard.writeText(messageContent)
      .then(() => {
        const button = document.getElementById('copy-message');
        button.textContent = 'Copied!';
        button.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
        button.classList.add('bg-green-100', 'text-green-700', 'hover:bg-green-200');
        
        setTimeout(() => {
          button.textContent = 'Copy to Clipboard';
          button.classList.remove('bg-green-100', 'text-green-700', 'hover:bg-green-200');
          button.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
        }, 2000);
      })
      .catch(err => console.error('Failed to copy message:', err));
  });

  // Regenerate message
  document.getElementById('regenerate').addEventListener('click', async () => {
    const positionLink = document.getElementById('position-link').value;
    const message = await generateMessage(
      referralForm.classList.contains('hidden') ? 'meeting' : 'referral',
      positionLink
    );
    document.getElementById('message-content').value = message;
  });
});

async function generateMessage(type, positionLink = '') {
  try {
    // Get data from local storage only
    const { resume, apiKey } = await chrome.storage.local.get(['resume', 'apiKey']);
    if (!resume || !apiKey) {
      throw new Error('Setup not completed');
    }
    
    let prompt;
    if (type === 'referral') {
      prompt = `Given this resume:\n${resume}\n\nAnd this job posting: ${positionLink}\n\nWrite a professional LinkedIn message requesting a referral. Keep it concise, friendly, and highlight relevant experience.`;
    } else {
      prompt = `Given this resume:\n${resume}\n\nWrite a professional LinkedIn message requesting a brief zoom call to learn more about their experience and potential opportunities. Keep it concise and friendly.`;
    }

    // Only make request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating message:', error);
    return 'Error generating message. Please try again.';
  }
}
