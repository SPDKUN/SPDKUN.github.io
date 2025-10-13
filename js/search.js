// themes/vivia/source/js/search.js
class LocalSearch {
  constructor() {
    this.searchData = [];
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');
    console.log('搜索初始化:', {
      input: this.searchInput,
      results: this.searchResults,
      dataLength: this.searchData.length
    });
    this.init();
  }

  async init() {
    await this.loadSearchData();
    this.bindEvents();
    console.log('搜索初始化完成，数据量:', this.searchData.length);
  }

  async loadSearchData() {
    try {
      console.log('开始加载搜索数据...');
      const response = await fetch('/search.xml');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text();
      console.log('搜索XML数据加载成功，长度:', data.length);
      
      const parser = new DOMParser();
      const xml = parser.parseFromString(data, 'application/xml');
      
      // 检查XML解析错误
      const parseError = xml.getElementsByTagName('parsererror');
      if (parseError.length > 0) {
        throw new Error('XML解析错误: ' + parseError[0].textContent);
      }
      
      const items = xml.getElementsByTagName('item');
      console.log('找到项目数量:', items.length);
      
      this.searchData = Array.from(items).map(item => {
        const title = item.getElementsByTagName('title')[0]?.textContent || '';
        const url = item.getElementsByTagName('link')[0]?.textContent || '';
        const content = item.getElementsByTagName('description')[0]?.textContent || '';
        
        return { title, url, content };
      });
      
      console.log('搜索数据加载完成:', this.searchData.length, '篇文章');
      
    } catch (error) {
      console.error('加载搜索数据失败:', error);
      this.showError('搜索功能暂时不可用: ' + error.message);
    }
  }

  bindEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', this.debounce(() => {
        console.log('搜索输入:', this.searchInput.value);
        this.performSearch();
      }, 300));
    } else {
      console.error('搜索输入框未找到!');
    }
  }

  performSearch() {
    const query = this.searchInput.value.toLowerCase().trim();
    console.log('执行搜索，关键词:', query);
    
    if (!this.searchResults) {
      console.error('搜索结果容器未找到!');
      return;
    }
    
    this.searchResults.innerHTML = '';
    
    if (query.length < 1) {
      this.searchResults.innerHTML = '<li class="search-tip">请输入搜索关键词</li>';
      return;
    }

    if (query.length < 2) {
      this.searchResults.innerHTML = '<li class="search-tip">请输入至少 2 个字符</li>';
      return;
    }

    console.log('开始筛选，数据量:', this.searchData.length);
    const results = this.searchData.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(query);
      const contentMatch = this.stripHtml(item.content).toLowerCase().includes(query);
      return titleMatch || contentMatch;
    });

    console.log('找到结果:', results.length);
    
    if (results.length === 0) {
      this.searchResults.innerHTML = '<li class="search-tip">没有找到相关文章</li>';
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
    const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  showError(message) {
    if (this.searchResults) {
      this.searchResults.innerHTML = `<li class="search-error">${message}</li>`;
    }
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
  console.log('DOM加载完成，初始化搜索...');
  new LocalSearch();
});