/**
 * Render analysis factors in the UI
 * @param {Array} factors - Array of factor objects
 */
export function renderFactors(factors) {
  const factorsList = document.querySelector('.factors-list');
  factorsList.innerHTML = ''; // Clear existing factors
  
  factors.forEach(factor => {
    const li = document.createElement('li');
    li.className = 'factor-item';
    
    // Create icon based on factor type
    let iconSvg = '';
    if (factor.type === 'good') {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (factor.type === 'warning') {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>`;
    } else if (factor.type === 'bad') {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
    }
    
    li.innerHTML = `
      <div class="factor-icon ${factor.type}">
        ${iconSvg}
      </div>
      <div class="factor-content">
        <div class="factor-title">${factor.title}</div>
        <div class="factor-description">${factor.description}</div>
      </div>
    `;
    
    factorsList.appendChild(li);
  });
}

/**
 * Update the score needle position
 * @param {number} score - The analysis score (0-100)
 */
export function updateNeedle(score) {
  const needle = document.querySelector('.score-needle');
  const scoreValue = document.querySelector('.score-value');
  
  // Calculate angle: -90 degrees (left) to 90 degrees (right)
  // Map score from 0-100 to -90 to 90 degrees
  const angle = (score / 100) * 180 - 90;
  
  needle.style.transform = `rotate(${angle}deg)`;
  scoreValue.textContent = `${score}%`;
}

/**
 * Update the result badge with the appropriate class and text
 * @param {number} score - The analysis score (0-100)
 */
export function updateResultBadge(score) {
  const badge = document.querySelector('.result-badge');
  const resultText = badge.querySelector('.result-text');
  
  // Remove existing classes
  badge.classList.remove('real', 'suspicious', 'fake');
  
  // Add appropriate class and text
  if (score < 30) {
    badge.classList.add('real');
    resultText.textContent = 'Likely Real';
  } else if (score < 70) {
    badge.classList.add('suspicious');
    resultText.textContent = 'Suspicious';
  } else {
    badge.classList.add('fake');
    resultText.textContent = 'Likely Fake';
  }
}