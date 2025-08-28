// popup/popup.js
(() => {
  // DOM elements
  const loginSection = document.getElementById('loginSection');
  const userSection = document.getElementById('userSection');
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const tokenFill = document.getElementById('tokenFill');
  const statusMessage = document.getElementById('statusMessage');
  const historyBtn = document.getElementById('historyBtn');
  const overlayBtn = document.getElementById('overlayBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const helpBtn = document.getElementById('helpBtn');

  // State
  let isLoggedIn = false;
  let currentUser = null;

  // Initialize
  const init = () => {
    checkLoginStatus();
    setupEventListeners();
  };

  // Check if user is logged in
  const checkLoginStatus = () => {
    chrome.storage.local.get(['user', 'isLoggedIn'], (result) => {
      if (result.isLoggedIn && result.user) {
        isLoggedIn = true;
        currentUser = result.user;
        showUserSection();
      } else {
        showLoginSection();
      }
    });
  };

  // Setup event listeners
  const setupEventListeners = () => {
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    historyBtn.addEventListener('click', openDashboard);
    settingsBtn.addEventListener('click', openDashboard);
    overlayBtn.addEventListener('click', toggleOverlay);
    helpBtn.addEventListener('click', showHelp);
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
      showStatus('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data
      const user = {
        id: 'user_123',
        name: email.split('@')[0],
        email: email,
        avatar: email.charAt(0).toUpperCase()
      };
      
      // Save to storage
      chrome.storage.local.set({
        user: user,
        isLoggedIn: true
      });
      
      isLoggedIn = true;
      currentUser = user;
      showUserSection();
      showStatus('Login successful!', 'success');
      
      // Clear form
      loginForm.reset();
      
    } catch (error) {
      showStatus('Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    chrome.storage.local.remove(['user', 'isLoggedIn']);
    isLoggedIn = false;
    currentUser = null;
    showLoginSection();
    showStatus('Logged out successfully', 'success');
  };

  // Toggle overlay
  const toggleOverlay = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_OVERLAY' }, (response) => {
          if (response && response.ok) {
            showStatus('Overlay toggled', 'success');
          } else {
            showStatus('Failed to toggle overlay', 'error');
          }
        });
      }
    });
  };

  // Open dashboard
  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/dashboard.html') });
  };

  // Show help
  const showHelp = () => {
    showStatus('Help documentation coming soon!', 'info');
  };

  // Show user section
  const showUserSection = () => {
    if (currentUser) {
      userAvatar.textContent = currentUser.avatar;
      userName.textContent = currentUser.name;
      userEmail.textContent = currentUser.email;
    }
    
    loginSection.style.display = 'none';
    userSection.classList.add('show');
  };

  // Show login section
  const showLoginSection = () => {
    userSection.classList.remove('show');
    loginSection.style.display = 'block';
  };

  // Set loading state
  const setLoading = (loading) => {
    const btnText = loginBtn.querySelector('.btn-text');
    const spinner = loginBtn.querySelector('.spinner');
    
    if (loading) {
      btnText.style.display = 'none';
      spinner.style.display = 'inline-block';
      loginBtn.classList.add('loading');
    } else {
      btnText.style.display = 'inline';
      spinner.style.display = 'none';
      loginBtn.classList.remove('loading');
    }
  };

  // Show status message
  const showStatus = (message, type = 'info') => {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
