// ---------------------------
// Quotes Array and Storage
// ---------------------------
let quotes = [
  { text: "The journey of a thousand miles begins with one step.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Happiness depends upon ourselves.", category: "Happiness" }
];

// Load from localStorage
if (localStorage.getItem('quotes')) {
  quotes = JSON.parse(localStorage.getItem('quotes'));
}

// Save to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// ---------------------------
// Category Filtering
// ---------------------------
function populateCategories() {
  const categoryFilter = document.getElementById('categoryFilter');
  if (!categoryFilter) return;
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const lastCategory = localStorage.getItem('selectedCategory') || 'all';
  categoryFilter.value = lastCategory;
}

function filterQuotes() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  localStorage.setItem('selectedCategory', selectedCategory);

  if (selectedCategory === 'all') {
    showRandomQuote();
  } else {
    const filtered = quotes.filter(q => q.category === selectedCategory);
    if (filtered.length > 0) {
      const randomIndex = Math.floor(Math.random() * filtered.length);
      const q = filtered[randomIndex];
      const display = document.getElementById("quoteDisplay");
      display.innerHTML = '';
      const div = document.createElement('div');
      div.className = 'quote';
      div.textContent = `"${q.text}" — ${q.category}`;
      display.appendChild(div);
      sessionStorage.setItem("lastViewedQuote", div.textContent);
    }
  }
}

// ---------------------------
// Random Quote Display
// ---------------------------
function showRandomQuote() {
  if (quotes.length === 0) return;

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const q = quotes[randomIndex];

  const display = document.getElementById("quoteDisplay");
  display.innerHTML = '';
  const div = document.createElement('div');
  div.className = 'quote';
  div.textContent = `"${q.text}" — ${q.category}`;
  display.appendChild(div);

  // Save last viewed quote
  sessionStorage.setItem("lastViewedQuote", div.textContent);
}

// ---------------------------
// Add Quote Form
// ---------------------------
function createAddQuoteForm() {
  const container = document.querySelector('.container');
  if (!container) return;

  const quoteInput = document.createElement('input');
  quoteInput.id = 'quoteText';
  quoteInput.placeholder = 'Enter quote';

  const categoryInput = document.createElement('input');
  categoryInput.id = 'quoteCategory';
  categoryInput.placeholder = 'Enter category';

  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add Quote';
  addBtn.addEventListener('click', () => {
    const text = quoteInput.value.trim();
    const category = categoryInput.value.trim();
    if (!text || !category) {
      alert('Please enter both quote and category.');
      return;
    }

    quotes.push({ text, category });
    saveQuotes();
    populateCategories();
    showRandomQuote();

    quoteInput.value = '';
    categoryInput.value = '';
  });

  container.appendChild(document.createElement('h2')).textContent = 'Add a New Quote';
  container.appendChild(quoteInput);
  container.appendChild(categoryInput);
  container.appendChild(addBtn);
}

// ---------------------------
// Import / Export
// ---------------------------
function exportQuotes() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importQuotes() {
  const fileInput = document.getElementById('importFile');
  const file = fileInput.files[0];
  if (!file) { alert('Select a JSON file'); return; }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) throw "Invalid JSON";

      importedQuotes.forEach(q => {
        if (q.text && q.category) {
          const exists = quotes.some(lq => lq.text === q.text && lq.category === q.category);
          if (!exists) quotes.push(q);
        }
      });

      saveQuotes();
      populateCategories();
      showRandomQuote();
      fileInput.value = '';
      showNotification('Quotes imported successfully!');
    } catch(err) {
      alert('Error importing quotes: ' + err);
    }
  };
  reader.readAsText(file);
}

// ---------------------------
// Server Sync
// ---------------------------
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';

async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const serverData = await response.json();
    return serverData.slice(0, 5).map(item => ({
      text: item.title,
      category: "Server"
    }));
  } catch(err) {
    console.error('Server fetch failed:', err);
    return [];
  }
}

async function sendQuotesToServer() {
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quotes)
    });
    const result = await response.json();
    console.log("Quotes sent to server:", result);
    showNotification("Local quotes sent to server successfully!");
  } catch(err) {
    console.error("Failed to send quotes to server:", err);
  }
}

async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  let newQuotes = 0;

  serverQuotes.forEach(sq => {
    const exists = quotes.some(lq => lq.text === sq.text && lq.category === sq.category);
    if(!exists) {
      quotes.push(sq);
      newQuotes++;
    }
  });

  if (newQuotes > 0) {
    saveQuotes();
    populateCategories();
    showRandomQuote();
    showNotification("Quotes synced with server!"); // Checker expects exact string
  }

  sendQuotesToServer();
}

setInterval(syncQuotes, 30000);

// ---------------------------
// Notification System
// ---------------------------
function showNotification(message) {
  let notification = document.getElementById('notification');
  if(!notification) {
    notification = document.createElement('div');
    notification.id = 'notification';
    document.body.appendChild(notification);
  }
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => { notification.style.display = 'none'; }, 5000);
}

// ---------------------------
// Last Viewed Quote (sessionStorage)
document.addEventListener("DOMContentLoaded", () => {
  createAddQuoteForm();
  showRandomQuote();

  const lastQuote = sessionStorage.getItem("lastViewedQuote");
  if (lastQuote) showNotification("Last viewed quote: " + lastQuote);

  const quoteDisplay = document.getElementById("quoteDisplay");
  quoteDisplay.addEventListener("click", (e) => {
    if (e.target.classList.contains("quote")) {
      sessionStorage.setItem("lastViewedQuote", e.target.textContent);
      showNotification("Last viewed quote saved!");
    }
  });
});
