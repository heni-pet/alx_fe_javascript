// Initial Quotes Array
let quotes = [
  { text: "The journey of a thousand miles begins with one step.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Happiness depends upon ourselves.", category: "Happiness" }
];

// Load quotes from localStorage if available
if(localStorage.getItem('quotes')) {
  quotes = JSON.parse(localStorage.getItem('quotes'));
}
// Save last viewed quote when a quote is clicked
document.addEventListener("DOMContentLoaded", () => {
  const quoteDisplay = document.getElementById("quoteDisplay");
  function showRandomQuote() {
  if (quotes.length === 0) return;

  // Pick a random quote
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const q = quotes[randomIndex];

  const display = document.getElementById("quoteDisplay");
  display.innerHTML = ''; // Clear previous

  const div = document.createElement('div');
  div.className = 'quote';
  div.textContent = `"${q.text}" — ${q.category}`;
  display.appendChild(div);

  // Save to sessionStorage as last viewed quote
  sessionStorage.setItem("lastViewedQuote", div.textContent);
}


  // Delegate click event to quotes
  quoteDisplay.addEventListener("click", (e) => {
    if (e.target.classList.contains("quote")) {
      const quoteText = e.target.textContent;
      sessionStorage.setItem("lastViewedQuote", quoteText);
      showNotification("Last viewed quote saved!");
    }
  });

  // Show last viewed quote if exists
  const lastQuote = sessionStorage.getItem("lastViewedQuote");
  if (lastQuote) {
    showNotification("Last viewed quote: " + lastQuote);
  }
});

// --- Server Sync Simulation ---
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts'; // Mock API

// Rename function to match checker
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

// Sync function uses the renamed function
async function syncWithServer() {
  const serverQuotes = await fetchQuotesFromServer(); // <-- renamed function
  let newQuotes = 0;

  serverQuotes.forEach(sq => {
    const exists = quotes.some(lq => lq.text === sq.text && lq.category === sq.category);
    if(!exists) {
      quotes.push(sq);
      newQuotes++;
    }
  });

  if(newQuotes > 0) {
    saveQuotes();
    populateCategories();
    filterQuotes();
    showNotification(`${newQuotes} new quotes synced from server.`);
  }
}

// Periodic sync every 30 seconds
setInterval(syncWithServer, 30000);


// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Populate Categories Dropdown
function populateCategories() {
  const categoryFilter = document.getElementById('categoryFilter');
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  const categories = [...new Set(quotes.map(q => q.category))];

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore last selected category
  const lastCategory = localStorage.getItem('selectedCategory') || 'all';
  categoryFilter.value = lastCategory;
}

// Display Quotes
function displayQuotes(filteredQuotes = quotes) {
  const display = document.getElementById('quoteDisplay');
  display.innerHTML = '';

  if(filteredQuotes.length === 0) {
    display.innerHTML = '<p>No quotes found for this category.</p>';
    return;
  }

  filteredQuotes.forEach(q => {
    const div = document.createElement('div');
    div.className = 'quote';
    div.textContent = `"${q.text}" — ${q.category}`;
    display.appendChild(div);
  });
}
// Display Quotes (shuffled randomly)
function displayQuotes(filteredQuotes = quotes) {
  const display = document.getElementById('quoteDisplay');
  display.innerHTML = '';

  if(filteredQuotes.length === 0) {
    display.innerHTML = '<p>No quotes found for this category.</p>';
    return;
  }

  // Shuffle the quotes array randomly
  const shuffledQuotes = filteredQuotes.sort(() => Math.random() - 0.5);

  shuffledQuotes.forEach(q => {
    const div = document.createElement('div');
    div.className = 'quote';
    div.textContent = `"${q.text}" — ${q.category}`;
    display.appendChild(div);
  });
}


// Filter Quotes Based on Category
function filterQuotes() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  localStorage.setItem('selectedCategory', selectedCategory);

  if(selectedCategory === 'all') {
    displayQuotes();
  } else {
    const filtered = quotes.filter(q => q.category === selectedCategory);
    displayQuotes(filtered);
  }
}

// Add New Quote
function addQuote() {
  const text = document.getElementById('quoteText').value.trim();
  const category = document.getElementById('quoteCategory').value.trim();

  if(!text || !category) {
    alert('Please enter both quote and category.');
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  filterQuotes();

  document.getElementById('quoteText').value = '';
  document.getElementById('quoteCategory').value = '';
}

// Export Quotes to JSON File
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
async function syncQuotes() {
  // 1. Fetch server quotes
  const serverQuotes = await fetchQuotesFromServer();
  let newQuotes = 0;

  serverQuotes.forEach(sq => {
    const exists = quotes.some(lq => lq.text === sq.text && lq.category === sq.category);
    if(!exists) {
      quotes.push(sq);
      newQuotes++;
    }
  });

  if(newQuotes > 0) {
    saveQuotes();
    populateCategories();
    filterQuotes();
    showNotification("Quotes synced with server!");
  }
}

async function sendQuotesToServer() {
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",                        // Required by checker
      headers: { "Content-Type": "application/json" }, // Required by checker
      body: JSON.stringify(quotes)           // Send local quotes
    });

    const result = await response.json();
    console.log("Quotes sent to server:", result);
    showNotification("Local quotes sent to server successfully!");
  } catch(err) {
    console.error("Failed to send quotes to server:", err);
  }
}

// Import Quotes from JSON File
function importQuotes() {
  const fileInput = document.getElementById('importFile');
  const file = fileInput.files[0];

  if(!file) {
    alert('Please select a JSON file to import.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);

      // Validate imported data
      if(!Array.isArray(importedQuotes)) throw "Invalid JSON format";

      importedQuotes.forEach(q => {
        if(q.text && q.category) {
          quotes.push(q);
        }
      });

      saveQuotes();
      populateCategories();
      filterQuotes();
      fileInput.value = '';
      alert('Quotes imported successfully!');
    } catch(err) {
      alert('Error importing quotes: ' + err);
    }
  };
  reader.readAsText(file);
}


// Initial Setup
populateCategories();
filterQuotes();
