/**
 * ProfileStorage class handles saving and retrieving profile data from Chrome's storage
 */
export class ProfileStorage {
  constructor() {
    this.PROFILES_KEY = 'instagram_fake_detector_profiles';
    this.SETTINGS_KEY = 'instagram_fake_detector_settings';
  }

  /**
   * Save a profile and its analysis to storage
   * @param {Object} profile - The profile data
   * @param {Object} analysis - The analysis results
   */
  async saveProfile(profile, analysis) {
    try {
      // Get existing profiles
      const profiles = await this.getProfiles();
      
      // Add new profile with timestamp
      profiles.unshift({
        profile,
        analysis,
        timestamp: new Date().toISOString()
      });
      
      // Limit to 20 most recent profiles
      const limitedProfiles = profiles.slice(0, 20);
      
      // Save back to storage
      await chrome.storage.local.set({
        [this.PROFILES_KEY]: limitedProfiles
      });
      
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  }

  /**
   * Get all saved profiles
   * @returns {Array} Array of profile objects
   */
  async getProfiles() {
    try {
      const result = await chrome.storage.local.get(this.PROFILES_KEY);
      return result[this.PROFILES_KEY] || [];
    } catch (error) {
      console.error('Error getting profiles:', error);
      throw error;
    }
  }

  /**
   * Get a profile by username
   * @param {string} username - The username to find
   * @returns {Object|null} The profile or null if not found
   */
  async getProfileByUsername(username) {
    try {
      const profiles = await this.getProfiles();
      return profiles.find(p => p.profile.username === username) || null;
    } catch (error) {
      console.error('Error getting profile by username:', error);
      throw error;
    }
  }

  /**
   * Clear all saved profiles
   */
  async clearProfiles() {
    try {
      await chrome.storage.local.remove(this.PROFILES_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing profiles:', error);
      throw error;
    }
  }

  /**
   * Save settings
   * @param {Object} settings - The settings object
   */
  async saveSettings(settings) {
    try {
      await chrome.storage.local.set({
        [this.SETTINGS_KEY]: settings
      });
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Get settings
   * @returns {Object} The settings object
   */
  async getSettings() {
    try {
      const result = await chrome.storage.local.get(this.SETTINGS_KEY);
      return result[this.SETTINGS_KEY] || {
        darkMode: false,
        strictness: 2
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  }
}