/**
 * Help Modal Handler
 * Loads and displays help content from markdown files
 */

class HelpModal {
  constructor() {
    this.modal = document.getElementById('help-modal');
    this.helpBtn = document.getElementById('help-btn');
    this.closeBtn = document.getElementById('help-modal-close');
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.tabPanes = {
      controls: document.getElementById('tab-controls'),
      rules: document.getElementById('tab-rules'),
      credits: document.getElementById('tab-credits')
    };
    
    this.init();
  }
  
  init() {
    // Setup event listeners
    if (this.helpBtn) {
      this.helpBtn.addEventListener('click', () => this.open());
    }
    
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    
    // Close on background click
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.close();
        }
      });
    }
    
    // Tab switching
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });
    
    // Load content
    this.loadContent();
  }
  
  open() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      // Switch to controls tab by default
      this.switchTab('controls');
    }
  }
  
  close() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }
  
  switchTab(tabName) {
    // Update tab buttons
    this.tabButtons.forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Update tab panes
    Object.keys(this.tabPanes).forEach(tab => {
      if (tab === tabName) {
        this.tabPanes[tab].classList.add('active');
      } else {
        this.tabPanes[tab].classList.remove('active');
      }
    });
  }
  
  async loadContent() {
    // Load Controls
    try {
      const controlsResponse = await fetch('CONTROLS.md');
      const controlsText = await controlsResponse.text();
      this.tabPanes.controls.innerHTML = this.markdownToHTML(controlsText);
    } catch (e) {
      this.tabPanes.controls.innerHTML = '<p>Could not load controls information.</p>';
    }
    
    // Load Rules
    try {
      const rulesResponse = await fetch('game rules');
      const rulesText = await rulesResponse.text();
      this.tabPanes.rules.innerHTML = this.markdownToHTML(rulesText);
    } catch (e) {
      this.tabPanes.rules.innerHTML = '<p>Could not load rules information.</p>';
    }
    
    // Load Credits
    try {
      const creditsResponse = await fetch('CREDITS.md');
      const creditsText = await creditsResponse.text();
      this.tabPanes.credits.innerHTML = this.markdownToHTML(creditsText);
    } catch (e) {
      this.tabPanes.credits.innerHTML = '<p>Could not load credits information.</p>';
    }
  }
  
  /**
   * Simple markdown to HTML converter
   */
  markdownToHTML(markdown) {
    let html = markdown;
    
    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr>');
    
    // Headers (process in order from largest to smallest)
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    
    // Code/backticks
    html = html.replace(/`(.*?)`/gim, '<code>$1</code>');
    
    // Lists - process bullet points
    const lines = html.split('\n');
    let inList = false;
    let processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this is a list item
      if (line.match(/^[-*] /)) {
        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
        }
        const listContent = line.replace(/^[-*] /, '');
        processedLines.push(`<li>${listContent}</li>`);
      } else if (line.match(/^\d+\. /)) {
        // Numbered list
        if (!inList) {
          processedLines.push('<ol>');
          inList = true;
        }
        const listContent = line.replace(/^\d+\. /, '');
        processedLines.push(`<li>${listContent}</li>`);
      } else {
        // Not a list item
        if (inList) {
          processedLines.push(inList ? '</ul>' : '</ol>');
          inList = false;
        }
        
        // Process non-list lines
        if (line && !line.match(/^<[h]/) && !line.match(/^<\/[h]/) && line !== '<hr>') {
          // Don't wrap headers, HRs, or empty lines
          if (line.length > 0) {
            processedLines.push(`<p>${line}</p>`);
          }
        } else {
          processedLines.push(line);
        }
      }
    }
    
    // Close any open list
    if (inList) {
      processedLines.push('</ul>');
    }
    
    html = processedLines.join('\n');
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    return html;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.helpModal = new HelpModal();
  });
} else {
  window.helpModal = new HelpModal();
}

