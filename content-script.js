/**
 * Content script that runs in the context of Instagram pages
 * Used for direct interaction with Instagram's UI
 */

console.log('Instagram Fake ID Detector content script loaded');

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeCurrentProfile') {
    // This function would be called when the popup requests profile analysis
    // We'll extract data directly from the DOM here
    
    // In this demo, we're using executeScript in popup.js instead,
    // but in a more complex extension, you might want to have persistent content scripts
    sendResponse({ status: 'ok' });
  }
});

// Add a button to Instagram profile pages
function addAnalyzeButton() {
  // Check if we're on a profile page
  if (!window.location.pathname.match(/^\/[^\/]+\/?$/)) {
    return; // Not a profile page
  }
  
  // Check if our button already exists
  if (document.getElementById('fake-id-detector-button')) {
    return; // Button already exists
  }
  
  // Find the right location to insert our button
  // This selector might need to be updated if Instagram changes their UI
  const buttonContainer = document.querySelector('header section div:last-child');
  if (!buttonContainer) {
    return; // Can't find the right location
  }
  
  // Create our button
  const button = document.createElement('button');
  button.id = 'fake-id-detector-button';
  button.className = 'detect-button';
  button.innerHTML = `
    <span class="detector-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-alert"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
    </span>
    <span>Detect</span>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .detect-button {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(45deg, #8a3ab9, #e95950, #fcaf45);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .detect-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .detector-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;
  
  document.head.appendChild(style);
  
  // Add click handler
  button.addEventListener('click', () => {
    // Open our extension popup
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
  
  // Insert button
  buttonContainer.appendChild(button);
}

// Run this on page load
setTimeout(addAnalyzeButton, 1500); // Delay to ensure Instagram's UI is loaded

// Also run when the URL changes (Instagram is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(addAnalyzeButton, 1500);
  }
}).observe(document, { subtree: true, childList: true });