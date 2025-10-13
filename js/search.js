// themes/vivia/source/js/search.js
class LocalSearch {
  constructor() {
    this.searchData = [];
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');
    console.log('搜索初始化:', {
      input: this.searchInput,
      results: this.searchResults
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
      console.log('搜索XML数据加载成功');
      
      const parser = new DOMParser();
      const xml = parser.parseFromString(data, 'application/xml');
      
      // 检查XML解析错误
      const parseError = xml.getElementsByTagName('parsererror');
      if (parseError.length > 0) {
        throw new Error('XML解析错误');
      }
      
      // 使用正确的选择器 - 注意：search.xml 中使用的是 <entry> 而不是 <item>
      const entries = xml.querySelectorAll('entry');
      console.log('找到条目数量:', entries.length);
      
      this.searchData = Array.from(entries).map(entry => {
        const title = entry.querySelector('title')?.textContent || '';
        const link = entry.querySelector('link')?.getAttribute('href') || '';
        const content = entry.querySelector('content')?.textContent || '';
        
        console.log('文章:', title, '链接:', link);
        return { 
          title: title.trim(), 
          url: link.trim(),
          content: content.trim()
        };
      });
      
      console.log('搜索数据加载完成:', this.searchData);
      
    } catch (error) {
      console.error('加载搜索数据失败:', error);
      this.showError('搜索功能暂时不可用');
    }
  }

  bindEvents() {
    if (this.searchInput && this.searchResults) {
      this.searchInput.addEventListener('input', this.debounce(() => {
        console.log('搜索输入:', this.searchInput.value);
        this.performSearch();
      }, 300));
    } else {
      console.error('搜索元素未找到!', {
        input: this.searchInput,
        results: this.searchResults
      });
    }
  }

  performSearch() {
    if (!this.searchInput || !this.searchResults) return;
    
    const query = this.searchInput.value.toLowerCase().trim();
    console.log('执行搜索，关键词:', query, '数据量:', this.searchData.length);
    
    this.searchResults.innerHTML = '';
    
    if (query.length < 1) {
      this.searchResults.innerHTML = '<li class="search-tip">请输入搜索关键词</li>';
      return;
    }

    if (query.length < 2) {
      this.searchResults.innerHTML = '<li class="search-tip">请输入至少 2 个字符</li>';
      return;
    }

    // 执行搜索
    const results = this.searchData.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(query);
      const contentMatch = item.content.toLowerCase().includes(query);
      const match = titleMatch || contentMatch;
      
      if (match) {
        console.log('匹配到文章:', item.title);
      }
      
      return match;
    });

    console.log('找到结果数量:', results.length);
    
    if (results.length === 0) {
      this.searchResults.innerHTML = '<li class="search-tip">没有找到相关文章</li>';
      return;
    }

    // 显示结果
    results.forEach(result => {
      const li = document.createElement('li');
      li.className = 'search-result-item';
      
      // 高亮处理
      const highlightedTitle = this.highlightText(result.title, query);
      const contentPreview = this.stripHtml(result.content).substring(0, 150);
      const highlightedContent = this.highlightText(contentPreview, query);
      
      li.innerHTML = `
        <a href="${result.url}">
          <h4>${highlightedTitle}</h4>
          <p>${highlightedContent}...</p>
        </a>
      `;
      this.searchResults.appendChild(li);
    });
  }

  highlightText(text, query) {
    if (!query || !text) return text || '';
    const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  stripHtml(html) {
    if (!html) return '';
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