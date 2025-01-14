// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open the sidebar
  chrome.sidePanel.open({ windowId: tab.windowId });
});
