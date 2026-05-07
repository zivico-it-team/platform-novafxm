const categories = {
  forex: [
    'EUR/USD',
    'USD/JPY',
    'GBP/USD',
    'AUD/USD',
    'USD/CAD',
    'NZD/USD'
  ],
  metals: ['Gold XAU/USD', 'Silver XAG/USD', 'Platinum', 'Palladium'],
  indices: ['S&P 500', 'Dow Jones', 'NASDAQ', 'FTSE 100', 'DAX', 'Nikkei 225'],
  crypto: ['Bitcoin BTC/USD', 'Ethereum ETH/USD', 'Ripple XRP/USD', 'Litecoin LTC/USD', 'Cardano ADA/USD'],
  stocks: ['AAPL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'GOOGL']
};

const categoryList = document.getElementById('categoryList');
const categoryTabs = document.querySelectorAll('.tab');
const selectedSymbol = document.getElementById('selectedSymbol');
const symbolSubtitle = document.querySelector('.symbol-subtitle');
const watchlist = document.getElementById('watchlist');
const refreshButton = document.getElementById('refreshWatchlist');
const searchInput = document.getElementById('symbolSearch');

function renderCategory(category) {
  categoryList.innerHTML = '';
  categories[category].forEach(symbol => {
    const item = document.createElement('li');
    item.textContent = symbol;
    item.addEventListener('click', () => selectSymbol(symbol, category));
    categoryList.appendChild(item);
  });
}

function selectSymbol(symbol, category) {
  selectedSymbol.textContent = symbol;
  symbolSubtitle.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} · Live · 0.72% · ${randomPrice()}`;
}

function randomPrice() {
  const whole = Math.floor(1 + Math.random() * 100);
  const fraction = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${whole}.${fraction}`;
}

function refreshWatchlist() {
  Array.from(watchlist.children).forEach(item => {
    const change = (Math.random() * 2 - 1).toFixed(2);
    item.textContent = `${item.textContent.split(' ')[0]} ${change > 0 ? '+' : ''}${change}%`;
  });
}

categoryTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    categoryTabs.forEach(node => node.classList.remove('active'));
    tab.classList.add('active');
    renderCategory(tab.dataset.category);
  });
});

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  const activeTab = document.querySelector('.tab.active').dataset.category;
  categoryList.innerHTML = '';
  categories[activeTab]
    .filter(symbol => symbol.toLowerCase().includes(query))
    .forEach(symbol => {
      const item = document.createElement('li');
      item.textContent = symbol;
      item.addEventListener('click', () => selectSymbol(symbol, activeTab));
      categoryList.appendChild(item);
    });
});

refreshButton.addEventListener('click', refreshWatchlist);

renderCategory('forex');
