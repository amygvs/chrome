//V4.1 - first update

// Initialize context menu items when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Remove any existing menus to avoid duplicates
  chrome.contextMenus.removeAll(() => {
	// Create a parent context menu item
	chrome.contextMenus.create({
	  id: "parent-menu",
	  title: "Custom Menu",
	  contexts: ["all"]
	});

	// Create child menu items
	chrome.contextMenus.create({
	  id: "scrape-links",
	  parentId: "parent-menu",
	  title: "Scrape all links",
	  contexts: ["all"]
	});
	
	chrome.contextMenus.create({
	  id: "scrape-selection",
	  parentId: "parent-menu",
	  title: "Scrape social links",
	  contexts: ["all"]
	});

	chrome.contextMenus.create({
	  id: "view-source",
	  parentId: "parent-menu",
	  title: "View source",
	  contexts: ["all"]
	});
	
	// Add a menu item that only appears when text is selected
	chrome.contextMenus.create({
	  id: "search-selection",
	  title: "Search for: '%s'",
	  contexts: ["selection"]
	});
  });
});

// Add keyboard shortcut listener
chrome.commands.onCommand.addListener((command) => {
  if (command === "scrape_links") {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        handleScrapeLinks(tabs[0]);
      }
    });
  }
});

// Add event listener for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "view-source":
      // Use Chrome's built-in view-source feature
      chrome.tabs.create({ url: 'view-source:' + tab.url });
      break;
    
    case "scrape-links":
      // Handle scraping links
      handleScrapeLinks(tab);
      break;
      
    case "scrape-selection":
      // Extract links from element under cursor - using a much simpler approach
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // Simple function to extract all links from the page
          const links = [];
			const relevantDomains = ['soundcloud.com', 'facebook.com', 'twitter.com', 'instagram.com', 'bandcamp.com', 'youtube.com', 'music.amazon.com', 'music.apple.com'];
          
          document.querySelectorAll('a[href]').forEach(link => {
            if (!link.href || link.href.startsWith('javascript:')) return;
            
            // Check if this is a relevant link
            const isRelevant = relevantDomains.some(domain => link.href.includes(domain));
            if (!isRelevant) return;
            
            try {
              // Get the raw URL
              const rawUrl = link.href;
              let cleanUrl = rawUrl;
              
              // Check if this is a redirect URL
              if (rawUrl.includes('/redirect?') || rawUrl.includes('redir_token=')) {
                // Extract the actual URL from YouTube's redirect
                const url = new URL(rawUrl);
                const redirectTarget = url.searchParams.get('q');
                if (redirectTarget) {
                  cleanUrl = decodeURIComponent(redirectTarget);
                }
              }
              
              // Create a URL object to work with the URL
              const urlObj = new URL(cleanUrl);
              
              // Get domain without www prefix
              let domain = urlObj.hostname;
              if (domain.startsWith('www.')) {
                domain = domain.substring(4);
              }
              
              // Get path without trailing slash
              let path = urlObj.pathname;
              if (path.endsWith('/')) {
                path = path.slice(0, -1);
              }
              
              // Create clean domain+path format
              const cleanDomainPath = domain + path;
              
              links.push({
                text: link.textContent.trim() || link.title || 'No title',
                rawUrl: rawUrl,
                url: cleanUrl,
                domain: domain,
                domainPath: cleanDomainPath
              });
            } catch (e) {
              // Skip invalid URLs
              console.error("Error processing URL:", link.href, e);
            }
          });
          
          // Create an overlay to display these links
          showLinksOverlay(links);
          
          // Helper function to display links in an overlay
          function showLinksOverlay(links) {
            // Create overlay container
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            overlay.style.zIndex = '9999';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            
            // Create content box
            const box = document.createElement('div');
            box.style.backgroundColor = 'white';
			  box.style.fontFamily = "Helvetica, Arial, sans-serif";
			  box.style.fontSize = "12px";
            box.style.width = '80%';
            box.style.maxWidth = '800px';
            box.style.maxHeight = '80%';
            box.style.padding = '20px';
            box.style.borderRadius = '8px';
            box.style.overflow = 'auto';
            box.style.position = 'relative';
            
            // Add heading
			  const heading = document.createElement('h2');
			  heading.textContent = `Found ${links.length} Links`;
			  heading.style.fontFamily = "Helvetica, Arial, sans-serif";
			  heading.style.fontSize = "14px";
			  heading.style.marginTop = '0';
            
            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'X';
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '10px';
            closeBtn.style.right = '10px';
            closeBtn.style.padding = '5px 10px';
            closeBtn.style.backgroundColor = '#e74c3c';
            closeBtn.style.color = 'white';
            closeBtn.style.border = 'none';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.onclick = () => document.body.removeChild(overlay);
            
            // Add copy buttons
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '10px';
            buttonContainer.style.marginBottom = '20px';
            buttonContainer.style.flexWrap = 'wrap';
            
            // Copy clean URLs button
            const copyCleanBtn = document.createElement('button');
            copyCleanBtn.textContent = 'Copy Clean URLs';
            copyCleanBtn.style.padding = '8px 12px';
            copyCleanBtn.style.backgroundColor = '#3498db';
            copyCleanBtn.style.color = 'white';
            copyCleanBtn.style.border = 'none';
            copyCleanBtn.style.borderRadius = '4px';
            copyCleanBtn.style.cursor = 'pointer';
            copyCleanBtn.onclick = () => {
              // Create a clean format with just domain paths, one per line
              // Replace the escaped newlines with actual newlines
              const cleanUrls = links.map(link => link.domainPath).join('\\n').replace(/\\n/g, '\n');
              copyToClipboard(cleanUrls);
              showMessage('Copied clean URLs!');
            };
            
            // Copy domain paths button
            const copyDomainsBtn = document.createElement('button');
            copyDomainsBtn.textContent = 'Copy Domain+Path';
            copyDomainsBtn.style.padding = '8px 12px';
            copyDomainsBtn.style.backgroundColor = '#2ecc71';
            copyDomainsBtn.style.color = 'white';
            copyDomainsBtn.style.border = 'none';
            copyDomainsBtn.style.borderRadius = '4px';
            copyDomainsBtn.style.cursor = 'pointer';
            copyDomainsBtn.onclick = () => {
              // Same format for now, optimized for your needs
              // Replace the escaped newlines with actual newlines
              const domainPaths = links.map(link => link.domainPath).join('\\n').replace(/\\n/g, '\n');
              copyToClipboard(domainPaths);
              showMessage('Copied domain paths!');
            };
            
            // Add copy as text button
            const copyTextBtn = document.createElement('button');
            copyTextBtn.textContent = 'Copy as Text';
            copyTextBtn.style.padding = '8px 12px';
            copyTextBtn.style.backgroundColor = '#9b59b6';
            copyTextBtn.style.color = 'white';
            copyTextBtn.style.border = 'none';
            copyTextBtn.style.borderRadius = '4px';
            copyTextBtn.style.cursor = 'pointer';
            copyTextBtn.onclick = () => {
              // Format with text and URL
              // Replace the escaped newlines with actual newlines
              const textWithUrls = links.map(link =>
                `${link.text}: ${link.domainPath}`
              ).join('\\n').replace(/\\n/g, '\n');
              copyToClipboard(textWithUrls);
              showMessage('Copied text with URLs!');
            };
            
            buttonContainer.appendChild(copyCleanBtn);
            buttonContainer.appendChild(copyDomainsBtn);
            buttonContainer.appendChild(copyTextBtn);
            
            // Create links list
            const linksList = document.createElement('div');
            linksList.style.border = '1px solid #eee';
            linksList.style.borderRadius = '4px';
            linksList.style.padding = '10px';
            
            links.forEach((link, index) => {
              const linkItem = document.createElement('div');
              linkItem.style.padding = '10px';
              linkItem.style.borderBottom = '1px solid #eee';
              if (index % 2 === 1) {
                linkItem.style.backgroundColor = '#f9f9f9';
              }
              
				const linkTitle = document.createElement('div');
				linkTitle.textContent = link.text;
				linkTitle.style.fontFamily = "Helvetica, Arial, sans-serif";
				linkTitle.style.fontSize = "12px";
				linkTitle.style.fontWeight = 'bold';
              
              const linkDomainPath = document.createElement('div');
              linkDomainPath.innerHTML = `<strong>Clean URL:</strong> <a href="${link.url}" target="_blank">${link.domainPath}</a>`;
              linkDomainPath.style.marginBottom = '5px';
              linkDomainPath.style.wordBreak = 'break-all';
              
              const linkDomain = document.createElement('div');
              linkDomain.textContent = `Domain: ${link.domain}`;
              linkDomain.style.fontSize = '12px';
              linkDomain.style.color = '#666';
              
              linkItem.appendChild(linkTitle);
              linkItem.appendChild(linkDomainPath);
              linkItem.appendChild(linkDomain);
              
              if (link.rawUrl !== link.url) {
                const originalUrl = document.createElement('div');
                originalUrl.innerHTML = `<strong>Original:</strong> ${link.rawUrl}`;
                originalUrl.style.fontSize = '11px';
                originalUrl.style.color = '#999';
                originalUrl.style.marginTop = '5px';
                originalUrl.style.wordBreak = 'break-all';
                linkItem.appendChild(originalUrl);
              }
              
              linksList.appendChild(linkItem);
            });
            
            // Assemble the overlay
            box.appendChild(heading);
            box.appendChild(closeBtn);
            box.appendChild(buttonContainer);
            box.appendChild(linksList);
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            
            // Helper functions
            function copyToClipboard(text) {
              const textarea = document.createElement('textarea');
              // Replace any escaped newlines with actual newlines
              textarea.value = text.replace(/\\n/g, '\n');
              textarea.style.position = 'fixed';
              textarea.style.left = '-9999px';
              document.body.appendChild(textarea);
              textarea.select();
              document.execCommand('copy');
              document.body.removeChild(textarea);
            }
            
            function showMessage(text) {
              const message = document.createElement('div');
              message.textContent = text;
              message.style.position = 'fixed';
              message.style.bottom = '20px';
              message.style.left = '50%';
              message.style.transform = 'translateX(-50%)';
              message.style.backgroundColor = '#2ecc71';
              message.style.color = 'white';
              message.style.padding = '10px 20px';
              message.style.borderRadius = '4px';
              message.style.zIndex = '10000';
              
              document.body.appendChild(message);
              setTimeout(() => {
                document.body.removeChild(message);
              }, 2000);
            }
          }
        }
      });
      break;
    
    case "search-selection":
      // Open a new tab with a search for the selected text
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(info.selectionText)}`;
      chrome.tabs.create({ url: searchUrl });
      break;
  }
});

// Function to get links from the element under cursor
function getElementLinks(clickX, clickY) {
  // Get the element where the click happened
  let element = document.elementFromPoint(clickX, clickY);
  if (!element) return;
  
  // Find a better container if needed
  let container = findBestContainer(element);
  
  // Get all links in this container
  const rawLinks = Array.from(container.querySelectorAll('a[href]'))
    .filter(link => link.href && !link.href.startsWith('javascript:'));
  
  // Process links to extract clean URLs and proper text
  const links = rawLinks.map(link => {
    const rawUrl = link.href;
    const text = link.textContent.trim() || link.title || 'No title';
    
    // Clean the URL
    let cleanUrl = rawUrl;
    let domain = '';
    
    try {
      // Check if this is a redirect URL
      if (rawUrl.includes('/redirect?') || rawUrl.includes('redir_token=')) {
        // Extract the actual URL from YouTube's redirect
        const url = new URL(rawUrl);
        const redirectTarget = url.searchParams.get('q');
        if (redirectTarget) {
          cleanUrl = decodeURIComponent(redirectTarget);
        }
      }
      
      // Remove tracking parameters from the URL
      const urlObj = new URL(cleanUrl);
      
      // Common tracking parameters to remove
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'ocid', 'ncid', 'ref', 'referrer', 'source'
      ];
      
      // Remove tracking parameters
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      // Get clean URL and domain
      cleanUrl = urlObj.toString();
      domain = urlObj.hostname;
      
      // Simplify domain by removing www. if present
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
      
    } catch (e) {
      console.error('Error processing URL:', rawUrl, e);
      domain = 'unknown';
    }
    
    return {
      text: text,
      rawUrl: rawUrl,
      url: cleanUrl,
      domain: domain
    };
  });
  
  // Create a fancy overlay to display the links
  createLinksOverlay(links, container);
}

// Function to find the best container with links
function findBestContainer(element) {
  // Check if the element itself has links
  const directLinks = element.querySelectorAll('a[href]');
  if (directLinks.length >= 2) {
    return element;
  }
  
  // Look for parent elements with more links
  let current = element;
  let bestContainer = element;
  let maxLinks = directLinks.length;
  let depth = 0;
  
  // Check up to 5 parent levels
  while (current.parentElement && depth < 5) {
    current = current.parentElement;
    const linkCount = current.querySelectorAll('a[href]').length;
    
    // If this level has more links, consider it better
    if (linkCount > maxLinks) {
      maxLinks = linkCount;
      bestContainer = current;
    }
    
    // If we find a section, article, div with class/id containing "link", etc.
    const tagName = current.tagName.toLowerCase();
    const hasLinkClass = (current.className && current.className.toLowerCase().includes('link'));
    const hasLinkId = (current.id && current.id.toLowerCase().includes('link'));
    
    if ((tagName === 'section' || tagName === 'article') && linkCount > 0) {
      return current;
    }
    
    if ((hasLinkClass || hasLinkId) && linkCount > 0) {
      return current;
    }
    
    depth++;
  }
  
  return bestContainer;
}

// Create a styled overlay to display the links
function createLinksOverlay(links, sourceElement) {
  // Remove any existing overlay
  const existingOverlay = document.getElementById('links-overlay-container');
  if (existingOverlay) {
    document.body.removeChild(existingOverlay);
  }
  
  // Create container
  const container = document.createElement('div');
  container.id = 'links-overlay-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  container.style.zIndex = '9999';
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.alignItems = 'center';
  container.style.padding = '20px';
  container.style.boxSizing = 'border-box';
  
  // Create content box
  const box = document.createElement('div');
  box.style.backgroundColor = 'white';
  box.style.borderRadius = '8px';
  box.style.padding = '20px';
  box.style.width = '80%';
  box.style.maxWidth = '800px';
  box.style.maxHeight = '80%';
  box.style.overflow = 'auto';
  box.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
  box.style.position = 'relative';
  
  // Create header
  const header = document.createElement('div');
  header.style.borderBottom = '1px solid #eee';
  header.style.paddingBottom = '10px';
  header.style.marginBottom = '15px';
  
  const title = document.createElement('h2');
  title.textContent = `Found ${links.length} Links in Selected Area`;
  title.style.margin = '0 0 10px 0';
  title.style.fontSize = '18px';
  title.style.color = '#333';
  
  // Element info
  const elementInfo = document.createElement('div');
  elementInfo.textContent = `Selected area: ${sourceElement.tagName.toLowerCase()}${sourceElement.id ? ' #' + sourceElement.id : ''}${sourceElement.className ? ' .' + sourceElement.className.replace(/ /g, '.') : ''}`;
  elementInfo.style.fontSize = '12px';
  elementInfo.style.color = '#666';
  elementInfo.style.marginBottom = '10px';
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '✕';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '10px';
  closeButton.style.right = '10px';
  closeButton.style.border = 'none';
  closeButton.style.background = 'transparent';
  closeButton.style.fontSize = '20px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.color = '#666';
  closeButton.onclick = () => {
    document.body.removeChild(container);
  };
  
  // Create actions row
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '10px';
  actions.style.flexWrap = 'wrap';
  actions.style.marginBottom = '15px';
  
  // Create copy buttons
  const copyCleanUrlsButton = createButton('Copy Clean URLs', '#3498db');
  copyCleanUrlsButton.onclick = () => {
    const cleanUrls = links.map(link => link.url).join('\n');
    copyToClipboard(cleanUrls);
    showToast('Clean URLs copied to clipboard!');
  };
  
  const copyDomainPathButton = createButton('Copy Domain+Path', '#2ecc71');
  copyDomainPathButton.onclick = () => {
    const domainPaths = links.map(link => {
      try {
        const urlObj = new URL(link.url);
        return urlObj.hostname + urlObj.pathname;
      } catch (e) {
        return link.url;
      }
    }).join('\n');
    copyToClipboard(domainPaths);
    showToast('Domain+Path format copied to clipboard!');
  };
  
  const copyCsvButton = createButton('Copy as CSV', '#e74c3c');
  copyCsvButton.onclick = () => {
    const csvHeader = 'Text,URL,Domain\n';
    const csvRows = links.map(link => {
      const text = link.text.replace(/"/g, '""');
      const url = link.url.replace(/"/g, '""');
      const domain = link.domain.replace(/"/g, '""');
      return `"${text}","${url}","${domain}"`;
    }).join('\n');
    copyToClipboard(csvHeader + csvRows);
    showToast('CSV copied to clipboard!');
  };
  
  const copyTabsButton = createButton('Copy for Sheets', '#9b59b6');
  copyTabsButton.onclick = () => {
    const tabSeparated = links.map(link => `${link.text}\t${link.url}\t${link.domain}`).join('\n');
    copyToClipboard(tabSeparated);
    showToast('Tab-separated text copied for spreadsheet!');
  };
  
  // Create links list
  const linksList = document.createElement('div');
  linksList.style.maxHeight = '400px';
  linksList.style.overflow = 'auto';
  linksList.style.border = '1px solid #eee';
  linksList.style.padding = '10px';
  linksList.style.borderRadius = '4px';
  
  // Add links to the list
  links.forEach((link, index) => {
    const linkItem = document.createElement('div');
    linkItem.style.padding = '8px';
    linkItem.style.borderBottom = '1px solid #f0f0f0';
    linkItem.style.display = 'flex';
    linkItem.style.alignItems = 'flex-start';
    
    // Number
    const number = document.createElement('span');
    number.textContent = (index + 1) + '.';
    number.style.marginRight = '10px';
    number.style.minWidth = '25px';
    number.style.fontWeight = 'bold';
    number.style.color = '#666';
    
    // Link details
    const details = document.createElement('div');
    details.style.flex = '1';
    
    const linkText = document.createElement('div');
    linkText.textContent = link.text;
    linkText.style.fontWeight = 'bold';
    linkText.style.marginBottom = '3px';
    
    const linkUrl = document.createElement('a');
    linkUrl.href = link.url;
    linkUrl.textContent = link.url;
    linkUrl.style.color = '#2980b9';
    linkUrl.style.fontSize = '12px';
    linkUrl.style.wordBreak = 'break-all';
    linkUrl.target = '_blank';
    linkUrl.style.display = 'block';
    linkUrl.style.marginBottom = '3px';
    
    const originalUrl = document.createElement('div');
    if (link.rawUrl !== link.url) {
      originalUrl.textContent = 'Original: ' + link.rawUrl;
      originalUrl.style.fontSize = '11px';
      originalUrl.style.color = '#999';
      originalUrl.style.wordBreak = 'break-all';
    }
    
    const domain = document.createElement('div');
    domain.textContent = 'Domain: ' + link.domain;
    domain.style.fontSize = '11px';
    domain.style.color = '#666';
    
    details.appendChild(linkText);
    details.appendChild(linkUrl);
    if (link.rawUrl !== link.url) {
      details.appendChild(originalUrl);
    }
    details.appendChild(domain);
    
    linkItem.appendChild(number);
    linkItem.appendChild(details);
    linksList.appendChild(linkItem);
    
    // Alternate background colors
    if (index % 2 === 1) {
      linkItem.style.backgroundColor = '#f9f9f9';
    }
  });
  
  // Assemble the overlay
  header.appendChild(title);
  header.appendChild(elementInfo);
  
  actions.appendChild(copyCleanUrlsButton);
  actions.appendChild(copyDomainPathButton);
  actions.appendChild(copyCsvButton);
  actions.appendChild(copyTabsButton);
  
  box.appendChild(closeButton);
  box.appendChild(header);
  box.appendChild(actions);
  box.appendChild(linksList);
  
  container.appendChild(box);
  document.body.appendChild(container);
  
  // Helper functions
  function createButton(text, color) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.padding = '8px 12px';
    button.style.backgroundColor = color;
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    return button;
  }
  
  function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
  
  function showToast(message) {
    // Check if a toast already exists
    let toast = document.getElementById('links-overlay-toast');
    if (toast) {
      document.body.removeChild(toast);
    }
    
    // Create new toast
    toast = document.createElement('div');
    toast.id = 'links-overlay-toast';
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#2ecc71';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '4px';
    toast.style.zIndex = '10000';
    toast.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    
    document.body.appendChild(toast);
    
    // Remove after 2 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 2000);
  }
}

// Function to handle scraping links
function handleScrapeLinks(tab) {
  // Execute script to get all links on the page
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractLinks
  }, (results) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    
    if (results && results[0] && results[0].result) {
      const links = results[0].result;
      
      // Create an HTML page with the links
      const htmlContent = createLinksHtml(links, tab.url);
      
      // Create a data URL from the HTML content
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
      
      // Open the data URL in a new tab
      chrome.tabs.create({ url: dataUrl });
    }
  });
}

// Function to extract all links from the current page
function extractLinks() {
  const links = [];
  const allLinks = document.querySelectorAll('a[href]');
  
  allLinks.forEach(link => {
    if (!link.href || link.href.startsWith('javascript:')) return;
    
    try {
      // Get the raw URL
      const rawUrl = link.href;
      let cleanUrl = rawUrl;
      
      // Check if this is a redirect URL
      if (rawUrl.includes('/redirect?') || rawUrl.includes('redir_token=')) {
        // Extract the actual URL from YouTube's redirect
        const url = new URL(rawUrl);
        const redirectTarget = url.searchParams.get('q');
        if (redirectTarget) {
          cleanUrl = decodeURIComponent(redirectTarget);
        }
      }
      
      // Create a URL object to work with the URL
      const urlObj = new URL(cleanUrl);
      
      // Remove tracking parameters
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
       'fbclid', 'gclid', 'ocid', 'ncid', 'ref', 'referrer', 'source'].forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      // Get the clean URL and domain
      cleanUrl = urlObj.toString();
      const domain = urlObj.hostname;
      
      links.push({
        text: link.textContent.trim() || link.title || 'No title',
        url: cleanUrl,
        domain: domain
      });
    } catch (e) {
      // Skip invalid URLs
      console.error("Error processing URL:", link.href, e);
    }
  });
  
  return links;
}

// Function to create HTML for the links page
function createLinksHtml(links, sourceUrl) {
  // Get unique links only (by URL)
  const uniqueLinks = Array.from(new Map(links.map(link => [link.url, link])).values());
  
  // Create HTML for table rows
  const rows = uniqueLinks.map(link => {
    const text = link.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
      <tr>
        <td>${text}</td>
        <td><a href="${link.url}" target="_blank">${link.url}</a></td>
        <td>${link.domain}</td>
      </tr>
    `;
  }).join('');
  
  // Create CSV data
  const csvRows = uniqueLinks.map(link => {
    const text = link.text.replace(/"/g, '""');
    const url = link.url.replace(/"/g, '""');
    const domain = link.domain.replace(/"/g, '""');
    return `"${text}","${url}","${domain}"`;
  });
  const csvData = ["Title,URL,Domain", ...csvRows].join('\\n');
  
  // Create HTML for the page
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Scraped Links</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }
    .info {
      background-color: #f8f9fa;
      padding: 10px 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .actions {
      margin: 15px 0;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    button {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover {
      background-color: #2980b9;
    }
    #copyForSheets {
      background-color: #4CAF50;
    }
    #copyForSheets:hover {
      background-color: #3e8e41;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background-color: #f8f9fa;
      text-align: left;
      padding: 12px;
      border-bottom: 2px solid #ddd;
      position: sticky;
      top: 0;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
      word-break: break-word;
    }
    td:nth-child(2) {
      font-family: monospace;
      font-size: 12px;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .filter {
      width: 100%;
      padding: 8px;
      margin-bottom: 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    .message {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #27ae60;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      display: none;
    }
  </style>
</head>
<body>
  <h1>Scraped Links</h1>
  
  <div class="info">
    <div>Source: <a href="${sourceUrl}" target="_blank">${sourceUrl}</a></div>
    <div>Found ${uniqueLinks.length} unique links</div>
  </div>
  
  <div class="actions">
    <button id="copyForSheets">Copy for Google Sheets</button>
    <button id="copyAsCSV">Copy as CSV</button>
    <button id="downloadCSV">Download CSV</button>
  </div>
  
  <input type="text" id="filterInput" class="filter" placeholder="Filter links...">
  
  <table>
    <thead>
      <tr>
        <th>Link Text</th>
        <th>URL</th>
        <th>Domain</th>
      </tr>
    </thead>
    <tbody id="linksTable">
      ${rows}
    </tbody>
  </table>
  
  <div id="message" class="message"></div>

  <script>
    // Filter functionality
    document.getElementById('filterInput').addEventListener('input', function() {
      const filter = this.value.toLowerCase();
      const rows = document.querySelectorAll('#linksTable tr');
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
      });
    });
    
    // Copy for Google Sheets
    document.getElementById('copyForSheets').addEventListener('click', function() {
      const rows = document.querySelectorAll('#linksTable tr:not([style*="display: none"])');
      let text = '';
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (text) text += '\\n';
        text += \`\${cells[0].textContent}\\t\${cells[1].textContent}\\t\${cells[2].textContent}\`;
      });
      
      copyToClipboard(text);
      showMessage('Copied for Google Sheets!');
    });
    
    // Copy as CSV
    document.getElementById('copyAsCSV').addEventListener('click', function() {
      copyToClipboard(${JSON.stringify(csvData)});
      showMessage('Copied as CSV!');
    });
    
    // Download CSV
    document.getElementById('downloadCSV').addEventListener('click', function() {
      const blob = new Blob([${JSON.stringify(csvData)}], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scraped_links.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showMessage('Downloaded CSV file!');
    });
    
    // Helper functions
    function copyToClipboard(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    
    function showMessage(text) {
      const message = document.getElementById('message');
      message.textContent = text;
      message.style.display = 'block';
      setTimeout(() => {
        message.style.display = 'none';
      }, 2000);
    }
  </script>
</body>
</html>
  `;
}
