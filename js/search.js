// themes/vivia/source/js/search.js
class LocalSearch {
  constructor() {
    this.searchData = [];
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');
    this.init();
  }

  async init() {
    await this.loadSearchData();
    this.bindEvents();
  }

  async loadSearchData() {
    try {
      const response = await fetch('/search.xml');
      const data = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(data, 'application/xml');
      const items = xml.getElementsByTagName('item');
      
      this.searchData = Array.from(items).map(item => {
        return {
          title: item.getElementsByTagName('title')[0]?.textContent || '',
          url: item.getElementsByTagName('link')[0]?.textContent || '',
          content: item.getElementsByTagName('description')[0]?.textContent || ''
        };
      });
    } catch (error) {
      console.error('加载搜索数据失败:', error);
    }
  }

  bindEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', this.debounce(() => {
        this.performSearch();
      }, 300));
    }
  }

  performSearch() {
    const query = this.searchInput.value.toLowerCase().trim();
    
    if (!this.searchResults) return;
    
    this.searchResults.innerHTML = '';
    
    if (query.length < 2) {
      this.searchResults.innerHTML = '<li>请输入至少 2 个字符</li>';
      return;
    }

    const results = this.searchData.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(query);
      const contentMatch = item.content.toLowerCase().includes(query);
      return titleMatch || contentMatch;
    });

    if (results.length === 0) {
      this.searchResults.innerHTML = '<li>没有找到相关文章</li>';
      return;
    }

    results.forEach(result => {
      const li = document.createElement('li');
      li.className = 'search-result-item';
      li.innerHTML = `
        <a href="${result.url}">
          <h4>${this.highlightText(result.title, query)}</h4>
          <p>${this.highlightText(this.stripHtml(result.content).substring(0, 150), query)}...</p>
        </a>
      `;
      this.searchResults.appendChild(li);
    });
  }

  highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// 初始化搜索
document.addEventListener('DOMContentLoaded', function() {
  new LocalSearch();
});