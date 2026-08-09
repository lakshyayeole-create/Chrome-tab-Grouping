/**
 * Helper to get user settings from chrome.storage
 */
export async function getSettings() {
  const defaults = {
    autoGroupEnabled: false,
    autoFreezeEnabled: true,
    freezeThresholdMinutes: 30,
    whitelistDomains: []
  };
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve({ ...defaults, ...(result.settings || {}) });
    });
  });
}

/**
 * Save settings to chrome.storage
 */
export async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings }, () => resolve());
  });
}

/**
 * Get all stashes
 */
export async function getStashes() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['stashes'], (result) => {
      resolve(result.stashes || []);
    });
  });
}

/**
 * Save a new stash
 */
export async function createStash(name, tabs) {
  const stashes = await getStashes();
  const newStash = {
    id: Date.now().toString(),
    name,
    createdAt: new Date().toISOString(),
    tabs: tabs.map(t => ({ url: t.url, title: t.title, favIconUrl: t.favIconUrl }))
  };
  stashes.push(newStash);
  return new Promise((resolve) => {
    chrome.storage.local.set({ stashes }, () => resolve(newStash));
  });
}

/**
 * Delete a stash by ID
 */
export async function deleteStash(id) {
  let stashes = await getStashes();
  stashes = stashes.filter(s => s.id !== id);
  return new Promise((resolve) => {
    chrome.storage.local.set({ stashes }, () => resolve());
  });
}

/**
 * Track tab access time (lastAccessed)
 */
export async function updateTabAccessTime(tabId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['tabAccessTimes'], (result) => {
      const times = result.tabAccessTimes || {};
      times[tabId] = Date.now();
      chrome.storage.local.set({ tabAccessTimes: times }, () => resolve());
    });
  });
}

export async function getTabAccessTimes() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['tabAccessTimes'], (result) => {
      resolve(result.tabAccessTimes || {});
    });
  });
}

export async function removeTabAccessTime(tabId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['tabAccessTimes'], (result) => {
      const times = result.tabAccessTimes || {};
      if (times[tabId]) {
        delete times[tabId];
        chrome.storage.local.set({ tabAccessTimes: times }, () => resolve());
      } else {
        resolve();
      }
    });
  });
}
