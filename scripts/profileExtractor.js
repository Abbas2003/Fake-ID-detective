/**
 * Extract profile data from the Instagram page
 * @param {number} tabId - The ID of the tab to extract data from
 * @returns {Promise<Object>} The extracted profile data
 */
export async function extractProfileData(tabId) {
  try {
    // Inject a content script to extract the data
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractDataFromPage
    });
    
    // Get the result from the first frame
    return results[0].result;
  } catch (error) {
    console.error('Error extracting profile data:', error);
    throw error;
  }
}

/**
 * This function runs in the context of the Instagram page
 * and extracts data about the profile
 */
function extractDataFromPage() {
  try {
    // Check if we're on a profile page
    const profileUrlPattern = /instagram\.com\/([^\/\?]+)/;
    const match = window.location.href.match(profileUrlPattern);
    
    if (!match) {
      throw new Error('Not on an Instagram profile page');
    }
    
    // Basic profile data
    const profileData = {
      username: '',
      fullName: '',
      bio: '',
      profileImage: '',
      isVerified: false,
      isPrivate: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      postDates: [],
      hasHighlights: false,
      hasExternalUrl: false,
      joinDate: null, // Might not be available
      engagement: 0, // Calculate later
      profileMetrics: {}
    };
    
    // Extract username from URL
    profileData.username = match[1];
    
    // Extract profile info from meta tags
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach(tag => {
      const property = tag.getAttribute('property');
      if (property === 'og:title') {
        const titleContent = tag.getAttribute('content');
        if (titleContent && titleContent.includes('•')) {
          profileData.fullName = titleContent.split('•')[0].trim();
        }
      } else if (property === 'og:description') {
        profileData.bio = tag.getAttribute('content') || '';
      } else if (property === 'og:image') {
        profileData.profileImage = tag.getAttribute('content') || '';
      }
    });
    
    // Try to extract follower/following/post counts from the page
    // This is more challenging due to Instagram's dynamic React structure
    // and frequent UI changes, so we'll use a more resilient approach
    
    // Extract counts from text content
    const textContent = document.body.textContent || '';
    
    // Extract potential follower counts using regex patterns
    function extractCounts(text) {
      // Look for patterns like "1,234 followers", "1.2M followers", etc.
      const followerPattern = /(\d+(?:,\d+)*|\d+(?:\.\d+)?[KMB])\s*followers/i;
      const followingPattern = /(\d+(?:,\d+)*|\d+(?:\.\d+)?[KMB])\s*following/i;
      const postsPattern = /(\d+(?:,\d+)*|\d+(?:\.\d+)?[KMB])\s*posts/i;
      
      const followerMatch = text.match(followerPattern);
      const followingMatch = text.match(followingPattern);
      const postsMatch = text.match(postsPattern);
      
      // Convert string numbers to actual numbers
      function parseCount(countStr) {
        if (!countStr) return 0;
        
        // Remove commas
        countStr = countStr.replace(/,/g, '');
        
        // Handle K, M, B suffixes
        if (countStr.endsWith('K') || countStr.endsWith('k')) {
          return parseFloat(countStr) * 1000;
        } else if (countStr.endsWith('M') || countStr.endsWith('m')) {
          return parseFloat(countStr) * 1000000;
        } else if (countStr.endsWith('B') || countStr.endsWith('b')) {
          return parseFloat(countStr) * 1000000000;
        } else {
          return parseInt(countStr, 10);
        }
      }
      
      if (followerMatch) profileData.followersCount = parseCount(followerMatch[1]);
      if (followingMatch) profileData.followingCount = parseCount(followingMatch[1]);
      if (postsMatch) profileData.postsCount = parseCount(postsMatch[1]);
    }
    
    extractCounts(textContent);
    
    // Check if the profile is verified (blue checkmark)
    profileData.isVerified = textContent.includes('Verified') || 
                           document.querySelector('svg[aria-label="Verified"]') !== null;
    
    // Check if the profile is private
    profileData.isPrivate = textContent.includes('This Account is Private') ||
                          textContent.includes('Private account');
    
    // Check for external URL
    const links = document.querySelectorAll('a');
    for (const link of links) {
      if (link.href && !link.href.includes('instagram.com') && 
          !link.href.includes('mailto:') && !link.href.includes('tel:')) {
        profileData.hasExternalUrl = true;
        break;
      }
    }
    
    // Check for story highlights
    profileData.hasHighlights = document.querySelectorAll('[role="menuitem"]').length > 0;
    
    // Extract additional signals for the AI to analyze
    profileData.profileMetrics = {
      usernameLength: profileData.username.length,
      hasNumbers: /\d/.test(profileData.username),
      specialCharsCount: (profileData.username.match(/[^a-zA-Z0-9_]/g) || []).length,
      underscoresCount: (profileData.username.match(/_/g) || []).length,
      hasBioLinks: profileData.bio.includes('http') || profileData.bio.includes('www.'),
      emojiCount: (profileData.bio.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length,
      followerToFollowingRatio: profileData.followingCount > 0 ? 
                              (profileData.followersCount / profileData.followingCount) : 0,
      postsPerFollower: profileData.followersCount > 0 ? 
                      (profileData.postsCount / profileData.followersCount) : 0
    };
    
    // Get up to 12 most recent posts
    const posts = document.querySelectorAll('article a time');
    if (posts.length > 0) {
      for (let i = 0; i < Math.min(posts.length, 12); i++) {
        const dateStr = posts[i].getAttribute('datetime');
        if (dateStr) {
          profileData.postDates.push(new Date(dateStr).toISOString());
        }
      }
    }
    
    return profileData;
  } catch (error) {
    console.error('Error in extractDataFromPage:', error);
    // Return basic data on error
    return {
      username: window.location.pathname.replace(/\//g, ''),
      error: error.message
    };
  }
}