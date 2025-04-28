/**
 * Analyzes a profile to determine if it's fake
 * @param {Object} profile - The profile data
 * @param {number} strictness - Strictness level (1-3)
 * @returns {Object} Analysis results
 */
export async function analyzeProfile(profile, strictness = 2) {
  try {
    const analysis = {
      score: 0,
      verdict: '',
      factors: [],
      confidence: 0
    };
    
    // Enhanced weights based on ML research
    const weights = getWeightsByStrictness(strictness);
    
    // Advanced scoring system
    let totalScore = 0;
    let totalWeights = 0;
    let confidenceFactors = [];
    
    // Username Analysis (20%)
    const usernameAnalysis = analyzeUsername(profile);
    totalScore += usernameAnalysis.score * weights.username;
    totalWeights += weights.username;
    confidenceFactors.push(usernameAnalysis.confidence);
    
    // Follower Analysis (25%)
    const followerAnalysis = analyzeFollowers(profile);
    totalScore += followerAnalysis.score * weights.followers;
    totalWeights += weights.followers;
    confidenceFactors.push(followerAnalysis.confidence);
    
    // Content Analysis (20%)
    const contentAnalysis = analyzeContent(profile);
    totalScore += contentAnalysis.score * weights.content;
    totalWeights += weights.content;
    confidenceFactors.push(contentAnalysis.confidence);
    
    // Profile Analysis (15%)
    const profileAnalysis = analyzeProfileCompleteness(profile);
    totalScore += profileAnalysis.score * weights.completeness;
    totalWeights += weights.completeness;
    confidenceFactors.push(profileAnalysis.confidence);
    
    // Engagement Analysis (20%)
    const engagementAnalysis = analyzeEngagement(profile);
    totalScore += engagementAnalysis.score * weights.engagement;
    totalWeights += weights.engagement;
    confidenceFactors.push(engagementAnalysis.confidence);
    
    // Calculate final score (0-100)
    analysis.score = Math.round((totalScore / totalWeights) * 100);
    
    // Calculate confidence level (0-100)
    analysis.confidence = Math.round(
      (confidenceFactors.reduce((a, b) => a + b, 0) / confidenceFactors.length) * 100
    );
    
    // Determine verdict with confidence threshold
    if (analysis.confidence >= 85) {
      if (analysis.score < 25) {
        analysis.verdict = 'Genuine (High Confidence)';
      } else if (analysis.score < 65) {
        analysis.verdict = 'Suspicious (High Confidence)';
      } else {
        analysis.verdict = 'Fake (High Confidence)';
      }
    } else {
      if (analysis.score < 25) {
        analysis.verdict = 'Likely Genuine';
      } else if (analysis.score < 65) {
        analysis.verdict = 'Potentially Suspicious';
      } else {
        analysis.verdict = 'Likely Fake';
      }
    }
    
    // Generate detailed factors
    analysis.factors = generateEnhancedFactors(
      profile,
      usernameAnalysis,
      followerAnalysis,
      contentAnalysis,
      profileAnalysis,
      engagementAnalysis
    );
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing profile:', error);
    throw error;
  }
}

function getWeightsByStrictness(strictness) {
  switch (strictness) {
    case 1: // Lenient
      return {
        username: 1.8,
        followers: 2.2,
        content: 1.5,
        completeness: 1.2,
        engagement: 2.0
      };
    case 3: // Strict
      return {
        username: 2.8,
        followers: 3.2,
        content: 2.5,
        completeness: 2.0,
        engagement: 3.0
      };
    case 2: // Balanced (default)
    default:
      return {
        username: 2.2,
        followers: 2.8,
        content: 2.0,
        completeness: 1.6,
        engagement: 2.5
      };
  }
}

function analyzeUsername(profile) {
  const { username, profileMetrics } = profile;
  let score = 0;
  let confidence = 0.8; // Base confidence
  
  // Advanced pattern detection
  const patterns = {
    randomString: /^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9]{8,}$/,
    excessiveNumbers: /\d{4,}/,
    suspiciousWords: /(real|official|original|genuine|authentic|backup|fan|thereal|fake|copy|clone|impersonator)/i,
    repeatingChars: /(.)\1{3,}/,
    leetSpeak: /[0-9]+[a-zA-Z]+[0-9]+|[a-zA-Z]+[0-9]+[a-zA-Z]+/
  };
  
  // Pattern matching with weighted scoring
  if (patterns.randomString.test(username)) {
    score += 0.4;
    confidence += 0.1;
  }
  
  if (patterns.excessiveNumbers.test(username)) {
    score += 0.3;
    confidence += 0.15;
  }
  
  if (patterns.suspiciousWords.test(username)) {
    score += 0.35;
    confidence += 0.2;
  }
  
  if (patterns.repeatingChars.test(username)) {
    score += 0.25;
    confidence += 0.1;
  }
  
  if (patterns.leetSpeak.test(username)) {
    score += 0.3;
    confidence += 0.15;
  }
  
  // Length analysis
  if (username.length > 20) {
    score += 0.2;
    confidence += 0.05;
  }
  
  // Character diversity analysis
  const charTypes = {
    lowercase: /[a-z]/g,
    uppercase: /[A-Z]/g,
    numbers: /[0-9]/g,
    special: /[^a-zA-Z0-9]/g
  };
  
  let charTypesUsed = 0;
  Object.values(charTypes).forEach(regex => {
    if (regex.test(username)) charTypesUsed++;
  });
  
  if (charTypesUsed >= 3) {
    score += 0.25;
    confidence += 0.1;
  }
  
  return {
    score: Math.min(score, 1),
    confidence: Math.min(confidence, 1),
    details: {
      hasRandomPattern: patterns.randomString.test(username),
      hasSuspiciousWords: patterns.suspiciousWords.test(username),
      charTypesUsed
    }
  };
}

function analyzeFollowers(profile) {
  const { followersCount, followingCount, postsCount } = profile;
  let score = 0;
  let confidence = 0.85; // Base confidence
  
  // Follower to Following Ratio Analysis
  const ratio = followersCount / (followingCount || 1);
  
  // Suspicious patterns
  const patterns = {
    highFollowersLowPosts: followersCount > 10000 && postsCount < 5,
    followingLimit: followingCount > 7400, // Instagram's limit is ~7500
    suspiciousRatio: ratio < 0.01 || ratio > 100,
    massFollowing: followingCount > 3000 && followersCount < 100,
    inactiveFollowing: followingCount > 1000 && postsCount < 3
  };
  
  // Weight each pattern
  if (patterns.highFollowersLowPosts) {
    score += 0.4;
    confidence += 0.1;
  }
  
  if (patterns.followingLimit) {
    score += 0.3;
    confidence += 0.15;
  }
  
  if (patterns.suspiciousRatio) {
    score += 0.35;
    confidence += 0.1;
  }
  
  if (patterns.massFollowing) {
    score += 0.45;
    confidence += 0.15;
  }
  
  if (patterns.inactiveFollowing) {
    score += 0.25;
    confidence += 0.1;
  }
  
  // Advanced ratio analysis
  if (followingCount > 0) {
    const engagementRate = (followersCount / followingCount) * (postsCount / 100);
    if (engagementRate < 0.01) {
      score += 0.3;
      confidence += 0.1;
    }
  }
  
  return {
    score: Math.min(score, 1),
    confidence: Math.min(confidence, 1),
    details: patterns
  };
}

function analyzeContent(profile) {
  const { postsCount, postDates, isPrivate } = profile;
  let score = 0;
  let confidence = 0.75; // Base confidence
  
  // Content patterns analysis
  const patterns = {
    noContent: postsCount === 0,
    minimalContent: postsCount < 3,
    suspiciousPrivate: isPrivate && postsCount < 3,
    regularPosting: false,
    burstPosting: false
  };
  
  if (patterns.noContent) {
    score += 0.5;
    confidence += 0.2;
  }
  
  if (patterns.minimalContent) {
    score += 0.3;
    confidence += 0.15;
  }
  
  if (patterns.suspiciousPrivate) {
    score += 0.35;
    confidence += 0.1;
  }
  
  // Analyze posting patterns
  if (postDates.length >= 3) {
    const dates = postDates.map(d => new Date(d)).sort((a, b) => b - a);
    const intervals = [];
    
    for (let i = 1; i < dates.length; i++) {
      intervals.push(dates[i-1] - dates[i]);
    }
    
    // Calculate statistics
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const stdDev = Math.sqrt(
      intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length
    );
    
    // Check for too regular posting (bot-like)
    if (stdDev / avg < 0.1) {
      patterns.regularPosting = true;
      score += 0.4;
      confidence += 0.2;
    }
    
    // Check for burst posting
    const shortIntervals = intervals.filter(i => i < 1000 * 60 * 5); // 5 minutes
    if (shortIntervals.length > intervals.length * 0.5) {
      patterns.burstPosting = true;
      score += 0.45;
      confidence += 0.15;
    }
  }
  
  return {
    score: Math.min(score, 1),
    confidence: Math.min(confidence, 1),
    details: patterns
  };
}

function analyzeProfileCompleteness(profile) {
  const { fullName, bio, profileImage, hasExternalUrl, hasHighlights, isVerified } = profile;
  let score = 0;
  let confidence = 0.9; // Base confidence
  
  // Profile completeness checks
  const checks = {
    hasFullName: !!fullName && fullName.length > 1,
    hasBio: !!bio && bio.length > 10,
    hasProfileImage: !!profileImage,
    hasUrl: hasExternalUrl,
    hasHighlights: hasHighlights,
    isVerified: isVerified
  };
  
  // Scoring based on completeness
  if (!checks.hasFullName) score += 0.2;
  if (!checks.hasBio) score += 0.25;
  if (!checks.hasProfileImage) score += 0.4;
  if (!checks.hasUrl && profile.followersCount > 1000) score += 0.15;
  if (!checks.hasHighlights && profile.postsCount > 10) score += 0.1;
  
  // Verified accounts get a significant reduction
  if (checks.isVerified) {
    score = Math.max(0, score - 0.6);
    confidence += 0.1;
  }
  
  // Bio analysis
  if (bio) {
    const bioPatterns = {
      excessiveEmoji: (bio.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length > 8,
      spamKeywords: /(dm|follow|message|win|giveaway|click|bio|link|money|earn|subscribe)/gi.test(bio),
      suspiciousUrls: (bio.match(/bit\.ly|tinyurl|linkin\.bio|linktr\.ee/g) || []).length > 0
    };
    
    if (bioPatterns.excessiveEmoji) score += 0.2;
    if (bioPatterns.spamKeywords) score += 0.25;
    if (bioPatterns.suspiciousUrls) score += 0.3;
  }
  
  return {
    score: Math.min(score, 1),
    confidence: Math.min(confidence, 1),
    details: { checks, bioAnalysis: bio ? true : false }
  };
}

function analyzeEngagement(profile) {
  const { followersCount, postsCount, profileMetrics } = profile;
  let score = 0;
  let confidence = 0.8; // Base confidence
  
  // Engagement metrics
  const metrics = {
    followerPostRatio: followersCount / (postsCount || 1),
    engagementRate: profileMetrics.engagement || 0,
    suspiciousGrowth: false,
    abnormalActivity: false
  };
  
  // Analyze follower to post ratio
  if (metrics.followerPostRatio > 10000) {
    score += 0.4;
    confidence += 0.15;
  }
  
  // Analyze engagement rate
  if (metrics.engagementRate < 0.001) {
    score += 0.35;
    confidence += 0.1;
  }
  
  // Check for suspicious growth patterns
  if (followersCount > 5000 && postsCount < 5) {
    metrics.suspiciousGrowth = true;
    score += 0.45;
    confidence += 0.2;
  }
  
  // Check for abnormal activity patterns
  if (profileMetrics.postsPerFollower < 0.0001) {
    metrics.abnormalActivity = true;
    score += 0.3;
    confidence += 0.15;
  }
  
  return {
    score: Math.min(score, 1),
    confidence: Math.min(confidence, 1),
    details: metrics
  };
}

function generateEnhancedFactors(profile, usernameAnalysis, followerAnalysis, contentAnalysis, profileAnalysis, engagementAnalysis) {
  const factors = [];
  
  // Username factors
  if (usernameAnalysis.score > 0.7) {
    factors.push({
      type: 'bad',
      title: 'Highly Suspicious Username',
      description: 'Multiple suspicious patterns detected in username structure.',
      confidence: Math.round(usernameAnalysis.confidence * 100) + '%'
    });
  } else if (usernameAnalysis.score > 0.3) {
    factors.push({
      type: 'warning',
      title: 'Questionable Username',
      description: 'Some unusual patterns found in username.',
      confidence: Math.round(usernameAnalysis.confidence * 100) + '%'
    });
  } else {
    factors.push({
      type: 'good',
      title: 'Natural Username',
      description: 'Username appears authentic and natural.',
      confidence: Math.round(usernameAnalysis.confidence * 100) + '%'
    });
  }
  
  // Follower patterns
  if (followerAnalysis.score > 0.7) {
    factors.push({
      type: 'bad',
      title: 'Artificial Following Pattern',
      description: `Highly unusual follower/following ratio and growth patterns.`,
      confidence: Math.round(followerAnalysis.confidence * 100) + '%'
    });
  } else if (followerAnalysis.score > 0.3) {
    factors.push({
      type: 'warning',
      title: 'Unusual Following Pattern',
      description: 'Some irregularities in follower/following patterns.',
      confidence: Math.round(followerAnalysis.confidence * 100) + '%'
    });
  } else {
    factors.push({
      type: 'good',
      title: 'Natural Following Pattern',
      description: 'Follower and following patterns appear organic.',
      confidence: Math.round(followerAnalysis.confidence * 100) + '%'
    });
  }
  
  // Content analysis
  if (contentAnalysis.score > 0.7) {
    factors.push({
      type: 'bad',
      title: 'Suspicious Content Patterns',
      description: 'Content posting behavior shows strong signs of automation.',
      confidence: Math.round(contentAnalysis.confidence * 100) + '%'
    });
  } else if (contentAnalysis.score > 0.3) {
    factors.push({
      type: 'warning',
      title: 'Unusual Content Patterns',
      description: 'Some irregularities detected in posting behavior.',
      confidence: Math.round(contentAnalysis.confidence * 100) + '%'
    });
  } else {
    factors.push({
      type: 'good',
      title: 'Natural Content Patterns',
      description: 'Content posting appears genuine and consistent.',
      confidence: Math.round(contentAnalysis.confidence * 100) + '%'
    });
  }
  
  // Profile completeness
  if (profileAnalysis.score > 0.7) {
    factors.push({
      type: 'bad',
      title: 'Incomplete Profile',
      description: 'Profile lacks multiple elements typical of genuine accounts.',
      confidence: Math.round(profileAnalysis.confidence * 100) + '%'
    });
  } else if (profileAnalysis.score > 0.3) {
    factors.push({
      type: 'warning',
      title: 'Basic Profile',
      description: 'Profile is missing some common elements.',
      confidence: Math.round(profileAnalysis.confidence * 100) + '%'
    });
  } else {
    factors.push({
      type: 'good',
      title: 'Complete Profile',
      description: 'Profile appears well-maintained and authentic.',
      confidence: Math.round(profileAnalysis.confidence * 100) + '%'
    });
  }
  
  // Engagement analysis
  if (engagementAnalysis.score > 0.7) {
    factors.push({
      type: 'bad',
      title: 'Artificial Engagement',
      description: 'Engagement patterns suggest automated or inauthentic activity.',
      confidence: Math.round(engagementAnalysis.confidence * 100) + '%'
    });
  } else if (engagementAnalysis.score > 0.3) {
    factors.push({
      type: 'warning',
      title: 'Questionable Engagement',
      description: 'Some engagement metrics appear unusual.',
      confidence: Math.round(engagementAnalysis.confidence * 100) + '%'
    });
  } else {
    factors.push({
      type: 'good',
      title: 'Natural Engagement',
      description: 'Engagement appears organic and consistent.',
      confidence: Math.round(engagementAnalysis.confidence * 100) + '%'
    });
  }
  
  // Add verification status if applicable
  if (profile.isVerified) {
    factors.push({
      type: 'good',
      title: 'Verified Account',
      description: 'This account has been verified by Instagram.',
      confidence: '100%'
    });
  }
  
  return factors;
}