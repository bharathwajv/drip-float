// pages/dashboard.js

// Import default sites from centralized config
let defaultSites = [];

let userSites = [];

// Navigation functionality
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    // Add active class to clicked item
    item.classList.add('active');
    
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    // Show selected section
    const sectionId = item.dataset.section;
    document.getElementById(sectionId).classList.add('active');
    
    // Load sites if settings section is selected
    if (sectionId === 'settings') {
      loadSites();
    }
  });
});

// Mobile menu toggle
document.getElementById('mobileMenuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Toggle switch functionality
document.getElementById('toggleSwitch').addEventListener('click', function() {
  this.classList.toggle('active');
  // Save state to storage
  chrome.storage.local.set({ overlayVisible: this.classList.contains('active') });
});

// Load saved state
chrome.storage.local.get(['overlayVisible'], (result) => {
  if (result.overlayVisible !== undefined) {
    const toggle = document.getElementById('toggleSwitch');
    if (result.overlayVisible) {
      toggle.classList.add('active');
    }
  }
});

// Site management functions
const loadSites = () => {
  chrome.storage.local.get(['userSites'], (result) => {
    userSites = result.userSites || [];
    displaySites();
  });
};

const displaySites = () => {
  const sitesList = document.getElementById('sitesList');
  const allSites = [...defaultSites, ...userSites];
  
  if (allSites.length === 0) {
    sitesList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No sites configured</p>';
    return;
  }
  
  sitesList.innerHTML = allSites.map((site, index) => `
    <div class="site-item" data-url="${site.url}">
      <div class="site-info">
        <div class="site-icon">${site.icon}</div>
        <div class="site-details">
          <h4>${site.name}</h4>
          <p>${site.url}</p>
        </div>
      </div>
      <div class="site-actions">
        ${userSites.some(s => s.url === site.url) ? 
          `<button class="btn-small danger" onclick="removeSite('${site.url}')" title="Remove site">🗑️</button>` : 
          `<span style="color: #6c757d; font-size: 12px;">Default</span>`
        }
      </div>
    </div>
  `).join('');
};

const addSite = () => {
  const input = document.getElementById('newSiteUrl');
  const url = input.value.trim();
  
  if (!url) {
    alert('Please enter a valid URL');
    return;
  }
  
  try {
    const urlObj = new URL(url);
    const name = urlObj.hostname.replace('www.', '');
    const icon = name.charAt(0).toUpperCase();
    
    const newSite = { url, name, icon };
    
    // Check if site already exists (either in user sites or default sites)
    if (userSites.some(site => site.url === url) || 
        defaultSites.some(site => url.startsWith(site.url))) {
      alert('This site is already in the list');
      return;
    }
    
    userSites.push(newSite);
    chrome.storage.local.set({ userSites }, () => {
      displaySites();
      input.value = '';
      alert('Site added successfully!');
    });
    
  } catch (error) {
    alert('Please enter a valid URL');
  }
};

const removeSite = (url) => {
  if (confirm('Are you sure you want to remove this site?')) {
    userSites = userSites.filter(site => site.url !== url);
    chrome.storage.local.set({ userSites }, () => {
      displaySites();
      alert('Site removed successfully!');
    });
  }
};

// Add site button event listener
document.getElementById('addSiteBtn').addEventListener('click', addSite);

// Enter key in input field
document.getElementById('newSiteUrl').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addSite();
  }
});

// Login form submission
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  // Simulate login
  console.log('Login attempt:', { email, password });
  
  // Show user profile (in real app, this would be after successful authentication)
  document.getElementById('loginForm').style.display = 'none';
  document.querySelector('.profile-section').style.display = 'block';
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
  // Show login form
  document.getElementById('loginForm').style.display = 'block';
  document.querySelector('.profile-section').style.display = 'none';
});

// History item click
document.querySelectorAll('.history-item').forEach(item => {
  item.addEventListener('click', () => {
    // Add click feedback
    item.style.transform = 'scale(0.98)';
    setTimeout(() => {
      item.style.transform = '';
    }, 150);
    
    // Placeholder: in the future this would deep-link to a detail page
    console.log('History item clicked:', item.querySelector('.item-title').textContent);
  });
});

// Initialize sites on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Load default sites from centralized config
  try {
    const { DEFAULT_SITES } = await import('../config/sites.js');
    defaultSites = DEFAULT_SITES;
  } catch (error) {
    console.error('Error loading default sites:', error);
    // Fallback to basic sites if import fails
    defaultSites = [
      { url: 'https://www.myntra.com', name: 'Myntra', icon: 'M' },
      { url: 'https://www.ajio.com', name: 'AJIO', icon: 'A' },
      { url: 'https://www.flipkart.com', name: 'Flipkart', icon: 'F' },
      { url: 'https://www.amazon.in', name: 'Amazon India', icon: 'A' },
      { url: 'https://www.nykaa.com', name: 'Nykaa', icon: 'N' }
    ];
  }
  loadSites();
});

// Make functions globally available for onclick handlers
window.removeSite = removeSite;
