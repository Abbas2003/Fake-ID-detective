import { extractProfileData } from './profileExtractor.js';
import { analyzeProfile } from './analyzer.js';
import { ProfileStorage } from './storage.js';
import { renderFactors, updateNeedle, updateResultBadge } from './uiHelpers.js';

// Initialize storage
const storage = new ProfileStorage();

// DOM Elements
const screens = {
  welcome: document.getElementById('welcome-screen'),
  loading: document.getElementById('loading-screen'),
  result: document.getElementById('result-screen'),
  history: document.getElementById('history-screen'),
  settings: document.getElementById('settings-screen')
};

// Buttons
const analyzeButton = document.getElementById('analyze-profile');
const viewHistoryButton = document.getElementById('view-history');
const exportResultButton = document.getElementById('export-result');
const analyzeAnotherButton = document.getElementById('analyze-another');
const backFromHistoryButton = document.getElementById('back-from-history');
const settingsButton = document.getElementById('settingsButton');
const backFromSettingsButton = document.getElementById('back-from-settings');
const clearHistoryButton = document.getElementById('clearHistoryBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const strictnessRange = document.getElementById('strictnessRange');

// Settings
let settings = {
  darkMode: false,
  strictness: 2 // 1: Lenient, 2: Balanced, 3: Strict
};

// Current profile data
let currentProfile = null;
let currentAnalysis = null;

// Initialize
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
  // Load settings
  loadSettings();
  
  // Add event listeners
  addEventListeners();
  
  // Check if we're on Instagram
  checkIfOnInstagram();
}

async function loadSettings() {
  try {
    const savedSettings = await storage.getSettings();
    if (savedSettings) {
      settings = savedSettings;
      
      // Apply settings to UI
      darkModeToggle.checked = settings.darkMode;
      strictnessRange.value = settings.strictness;
      
      // Apply dark mode if enabled
      if (settings.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function addEventListeners() {
  // Main actions
  analyzeButton.addEventListener('click', startAnalysis);
  viewHistoryButton.addEventListener('click', showHistoryScreen);
  exportResultButton.addEventListener('click', exportResult);
  analyzeAnotherButton.addEventListener('click', returnToWelcome);
  
  // Navigation
  backFromHistoryButton.addEventListener('click', returnToWelcome);
  settingsButton.addEventListener('click', showSettingsScreen);
  backFromSettingsButton.addEventListener('click', returnToWelcome);
  
  // Settings
  clearHistoryButton.addEventListener('click', clearHistory);
  darkModeToggle.addEventListener('change', toggleDarkMode);
  strictnessRange.addEventListener('change', updateStrictness);
}

async function checkIfOnInstagram() {
  try {
    // Query the active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    // Check if the URL is Instagram
    const isInstagram = activeTab.url && activeTab.url.includes('instagram.com');
    
    // Enable/disable analyze button based on if we're on Instagram
    analyzeButton.disabled = !isInstagram;
    
    if (!isInstagram) {
      analyzeButton.classList.add('disabled');
      analyzeButton.textContent = 'Not on Instagram';
    }
  } catch (error) {
    console.error('Error checking Instagram:', error);
    analyzeButton.disabled = true;
    analyzeButton.classList.add('disabled');
    analyzeButton.textContent = 'Error';
  }
}

function showScreen(screenId) {
  // Hide all screens
  Object.values(screens).forEach(screen => {
    screen.classList.add('hidden');
  });
  
  // Show requested screen
  screens[screenId].classList.remove('hidden');
}

async function startAnalysis() {
  try {
    showScreen('loading');
    
    // Update loading status
    updateLoadingStatus('Connecting to page...');
    
    // Get active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    // Extract profile data
    updateLoadingStatus('Extracting profile data...');
    currentProfile = await extractProfileData(activeTab.id);
    
    // Analyze the profile
    updateLoadingStatus('Running AI analysis...');
    currentAnalysis = await analyzeProfile(currentProfile, settings.strictness);
    
    // Save to history
    await storage.saveProfile(currentProfile, currentAnalysis);
    
    // Show results
    showResults();
  } catch (error) {
    console.error('Analysis error:', error);
    alert('Error analyzing profile. Please try again.');
    returnToWelcome();
  }
}

function updateLoadingStatus(message) {
  const statusText = document.querySelector('.status-text');
  statusText.textContent = message;
  
  // Update progress bar animation
  const progressBar = document.querySelector('.progress-bar');
  if (message.includes('Connecting')) {
    progressBar.style.width = '30%';
  } else if (message.includes('Extracting')) {
    progressBar.style.width = '60%';
  } else if (message.includes('Running')) {
    progressBar.style.width = '90%';
  }
}

function showResults() {
  // Update profile info
  const profileImage = document.querySelector('.profile-image');
  const username = document.querySelector('.username');
  
  if (currentProfile.profileImage) {
    profileImage.style.backgroundImage = `url(${currentProfile.profileImage})`;
  }
  
  username.textContent = `@${currentProfile.username}`;
  
  // Update analysis results
  updateResultBadge(currentAnalysis.score);
  updateNeedle(currentAnalysis.score);
  
  // Update factors list
  renderFactors(currentAnalysis.factors);
  
  // Show the result screen
  showScreen('result');
}

function exportResult() {
  if (!currentProfile || !currentAnalysis) return;
  
  const resultData = {
    username: currentProfile.username,
    analyzedAt: new Date().toISOString(),
    score: currentAnalysis.score,
    verdict: currentAnalysis.verdict,
    factors: currentAnalysis.factors,
  };
  
  // Create a blob and download
  const blob = new Blob([JSON.stringify(resultData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `ig-analysis-${currentProfile.username}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function showHistoryScreen() {
  try {
    // Get history
    const history = await storage.getProfiles();
    const historyList = document.querySelector('.history-list');
    const emptyHistory = document.querySelector('.empty-history');
    
    // Clear previous list
    historyList.innerHTML = '';
    
    if (history.length === 0) {
      // Show empty state
      historyList.classList.add('hidden');
      emptyHistory.classList.remove('hidden');
    } else {
      // Populate list
      historyList.classList.remove('hidden');
      emptyHistory.classList.add('hidden');
      
      history.forEach(item => {
        const historyItem = createHistoryItem(item);
        historyList.appendChild(historyItem);
      });
    }
    
    showScreen('history');
  } catch (error) {
    console.error('Error loading history:', error);
    alert('Error loading history. Please try again.');
  }
}

function createHistoryItem(item) {
  const { profile, analysis, timestamp } = item;
  
  const div = document.createElement('div');
  div.className = 'history-item';
  div.dataset.username = profile.username;
  
  // Format date
  const date = new Date(timestamp);
  const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Get verdict class
  let verdictClass = '';
  if (analysis.score < 30) {
    verdictClass = 'real';
  } else if (analysis.score < 70) {
    verdictClass = 'suspicious';
  } else {
    verdictClass = 'fake';
  }
  
  div.innerHTML = `
    <div class="history-profile-image" ${profile.profileImage ? `style="background-image: url(${profile.profileImage})"` : ''}></div>
    <div class="history-profile-info">
      <div class="history-username">@${profile.username}</div>
      <div class="history-date">${formattedDate}</div>
    </div>
    <div class="history-result ${verdictClass}">${analysis.verdict}</div>
  `;
  
  // Add click listener to view this result
  div.addEventListener('click', () => {
    currentProfile = profile;
    currentAnalysis = analysis;
    showResults();
  });
  
  return div;
}

function returnToWelcome() {
  showScreen('welcome');
}

function showSettingsScreen() {
  showScreen('settings');
}

async function clearHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    try {
      await storage.clearProfiles();
      alert('History cleared successfully.');
      returnToWelcome();
    } catch (error) {
      console.error('Error clearing history:', error);
      alert('Error clearing history. Please try again.');
    }
  }
}

async function toggleDarkMode(e) {
  settings.darkMode = e.target.checked;
  
  if (settings.darkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  
  await storage.saveSettings(settings);
}

async function updateStrictness(e) {
  settings.strictness = parseInt(e.target.value);
  await storage.saveSettings(settings);
}