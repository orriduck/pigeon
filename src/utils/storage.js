export async function saveUserData(resume, apiKey) {
  try {
    await chrome.storage.local.set({
      resume,
      apiKey,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error saving to local storage:', error);
    throw error;
  }
}

export async function getUserData() {
  try {
    return await chrome.storage.local.get(['resume', 'apiKey']);
  } catch (error) {
    console.error('Error getting from local storage:', error);
    throw error;
  }
}

export async function clearUserData() {
  try {
    await chrome.storage.local.clear();
  } catch (error) {
    console.error('Error clearing local storage:', error);
    throw error;
  }
}
