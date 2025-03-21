# Chrome Link Scraper Extension

A Chrome extension for easily extracting and formatting links from web pages. This extension adds context menu options to extract links from any webpage, with special formatting for social media and official website links.

## Features

- **Extract Links**: Right-click and select "Scrape Links" to extract all links from the current page
- **View Source**: See the formatted source code of any webpage
- **Element-Based Scraping**: Right-click on a specific section to extract only relevant links
- **Multiple Copy Formats**:
  - Copy Clean URLs: Get links in a clean, three-column format (Name, Domain, URL)
  - Copy Domain+Path: Get domain and path combinations without tracking parameters
  - Copy as Text: Get links with descriptive text
- **Smart Link Cleaning**:
  - Automatically strips tracking parameters (UTM, fbclid, etc.)
  - Unwraps redirect links from platforms like YouTube
  - Removes www prefixes and trailing slashes for cleaner URLs
- **Non-invasive Interface**: Results appear in a sidebar instead of covering the page

## Installation

### From GitHub (For Development)

1. Clone this repository:
   ```
   git clone https://github.com/YOUR_USERNAME/chrome-link-scraper-extension.git
   ```
   
2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" using the toggle in the top-right corner

4. Click "Load unpacked" and select the extension directory

5. The extension will now be installed and ready to use

### Private Distribution

This extension is not available on the Chrome Web Store. It's intended for private use and can be shared directly with trusted users.

## Usage

1. **Scrape All Links**:
   - Right-click anywhere on a page
   - Select "Custom Menu" > "Scrape Links"
   - View and copy the extracted links from the sidebar that appears

2. **Scrape Section Links**:
   - Right-click on a section containing links (like a navigation menu or social media links)
   - Select "Custom Menu" > "Scrape from Element"
   - View and copy only the links from that section

3. **View Page Source**:
   - Right-click anywhere on a page
   - Select "Custom Menu" > "View Source"
   - See the formatted source code in a new tab

4. **Keyboard Shortcut**:
   - Press `Shift+Command+L` (Mac) to quickly scrape links from the current page

## Files

- **manifest.json**: Extension configuration and permissions
- **background.js**: Core functionality and context menu setup
- **content.js**: Content script for page interaction
- **icon.png**: Extension icon

## Updating

To update the extension:

1. Pull the latest changes from GitHub:
   ```
   git pull origin main
   ```

2. Go to `chrome://extensions/` in Chrome

3. Click the refresh icon on the extension card

## Privacy

This extension:
- Does not collect or transmit any data
- Does not require an internet connection to function
- Only accesses the current tab when activated via the context menu
- Does not modify any webpage content except when displaying results

## License

This is a private tool not intended for redistribution.
