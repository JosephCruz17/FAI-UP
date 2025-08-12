// Shared: mobile nav toggle + footer year
(function setupGlobalUI() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.getElementById('primary-navigation');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

// Chat: only run on Contact page when elements exist
(function setupChat() {
  const form = document.getElementById('chat-form');
  const allMessages = document.getElementById('all-messages');
  if (!form || !allMessages) return; // Not on chat page

  const usernameElem = document.getElementById('username');
  const messageElem = document.getElementById('message');
  const emailElem = document.getElementById('email');
  const profileElem = document.getElementById('profile');
  const previewImg = document.getElementById('preview-image');
  const sendBtn = document.getElementById('send-btn');
  const darkModeBtn = document.getElementById('dark-mode-toggle');

  // Enable submit only when username + message present
  function updateSendButtonState() {
    sendBtn.disabled =
      !usernameElem.value.trim() || !messageElem.value.trim();
  }
  usernameElem.addEventListener('input', updateSendButtonState);
  messageElem.addEventListener('input', updateSendButtonState);
  updateSendButtonState();

  // Live preview for profile image
  if (profileElem && previewImg) {
    profileElem.addEventListener('input', () => {
      const url = profileElem.value.trim();
      previewImg.src =
        url ||
        'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
    });
  }

  // Emoji parsing (safe)
  function parseEmojis(text) {
    const map = {
      ':heart:': '❤️',
      ':smile:': '😄',
      ':thumbsup:': '👍',
      ':fire:': '🔥',
      ':laugh:': '😂',
      ':100:': '💯',
      ':pizza:': '🍕',
    };
    let output = String(text || '');
    for (const code in map) {
      const re = new RegExp(
        code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'g'
      );
      output = output.replace(re, map[code]);
    }
    return output;
  }

  // Create DOM for a single message
  function makeMessageDOM(data) {
    const wrap = document.createElement('div');
    wrap.className = 'single-message';

    const img = document.createElement('img');
    img.className = 'single-message-img';
    img.alt = `${data.USERNAME || 'User'} profile image`;
    img.src =
      data.PROFILE ||
      'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

    const usernameP = document.createElement('p');
    usernameP.className = 'single-message-username';
    usernameP.textContent = `${data.USERNAME || 'Anonymous'}:`;

    const bodyP = document.createElement('p');
    bodyP.className = 'single-message-body';
    bodyP.textContent = parseEmojis(data.MESSAGE);

    const meta = document.createElement('div');
    meta.className = 'single-message-meta';

    if (data.EMAIL) {
      const emailSpan = document.createElement('span');
      emailSpan.textContent = `Email: ${data.EMAIL}`;
      meta.appendChild(emailSpan);
    }
    if (data.DATE) {
      const dateSpan = document.createElement('span');
      dateSpan.textContent = data.DATE;
      meta.appendChild(dateSpan);
    }
    if (data.TIME) {
      const timeSpan = document.createElement('span');
      timeSpan.textContent = data.TIME;
      meta.appendChild(timeSpan);
    }

    wrap.appendChild(img);
    wrap.appendChild(usernameP);
    wrap.appendChild(bodyP);
    wrap.appendChild(meta);
    return wrap;
  }

  function addMessageToBoard(data) {
    const node = makeMessageDOM(data);
    allMessages.appendChild(node);
    allMessages.scrollTop = allMessages.scrollHeight;
  }

  // Guard: Firebase CDNs must be present on this page
  if (typeof firebase === 'undefined') {
    console.warn('Firebase not loaded. Ensure CDNs are included on Contact.html');
    return;
  }

  // Firebase init — REPLACE with your project config
  var firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxx"
  };
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // DB reference (namespace messages)
  const database = firebase.database().ref('messages');

  // Listen for new messages
  database.on('child_added', (snapshot) => {
    const data = snapshot.val();
    addMessageToBoard(data);
  });

  // Submit handler
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = usernameElem.value.trim();
    const message = messageElem.value.trim();
    const email = emailElem.value.trim();
    const profile = profileElem.value.trim();

    if (!username || !message) return;

    const now = new Date();
    const payload = {
      USERNAME: username,
      MESSAGE: message,
      EMAIL: email,
      PROFILE:
        profile ||
        'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
      DATE: now.toLocaleDateString(),
      TIME: now.toLocaleTimeString(),
    };

    database.push(payload);
    messageElem.value = '';
    updateSendButtonState();
    messageElem.focus();
  });

  // Enter to submit
  messageElem.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !sendBtn.disabled) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  // Dark mode toggle (scoped to chat page)
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('chat-dark');
      darkModeBtn.setAttribute('aria-pressed', String(isDark));
    });
  }
})();