# Smart Tab Stash & Auto-Group

A Chrome extension that automatically organizes, monitors, and optimizes your browser tabs. Perfect for students, researchers, and anyone who opens dozens of tabs, ending up with a cluttered browser that slows down their computer.

## Features

- **Auto-Group Tabs**: Automatically classifies newly opened tabs based on URLs and titles and groups them into standard topics (e.g., *Dev & Code*, *Research & Search*, *Media & Entertainment*).
- **Smart Grouping**: Prevents duplicate groups. If a tab group for a specific topic already exists in your window, new tabs of that topic are placed directly into it.
- **Memory Optimizer (Tab Freezing)**: Automatically identifies inactive tabs and discards them after a user-defined threshold (default: 30 minutes) to save RAM. The tabs remain visible in your tab bar and reload instantly when clicked.
- **Session Stashing**: Save all open tabs in your current window into a "Stash" and restore them later with one click.
- **Clean UI**: A user-friendly, fast, and simple Blue-Violet themed dashboard with no bloated animations.
- **Customizable**: Add your own whitelisted domains that should never be frozen, toggle auto-grouping, and configure the inactivity threshold directly from the settings.

## Installation

Since this extension is not currently published on the Chrome Web Store, you can load it locally:

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top right corner.
4. Click the **Load unpacked** button.
5. Select the `Chrome-tab-Grouping` directory.
6. The extension is now installed! You can pin it to your toolbar for easy access.

## Tech Stack

- **HTML/CSS**: Plain HTML and CSS files for a simple, fast, and organized UI.
- **JavaScript**: Core logic for the extension popup and background service worker.
- **Chrome Extension API (Manifest V3)**: Utilizes `chrome.tabs`, `chrome.tabGroups`, `chrome.storage`, and `chrome.alarms`.
- **Zero Backend**: All data (settings, session stashes, and tab access timestamps) is saved locally in your browser using `chrome.storage.local`.

## How It Works

1. **Categorizer**: The extension runs a lightweight keyword and domain matching algorithm (`utils/categorizer.js`) to classify URLs into topics.
2. **Background Worker**: A Manifest V3 Service Worker (`background.js`) tracks tab activity and runs a 1-minute alarm to freeze inactive tabs safely (skipping active tabs, pinned tabs, and tabs playing audio).
3. **Tab Groups API**: Uses Chrome's native Tab Groups feature to visually organize your workspace.

## License

MIT License
