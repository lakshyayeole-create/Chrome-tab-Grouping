import { categorizeTab } from './utils/categorizer.js';
import { 
  getSettings, 
  updateTabAccessTime, 
  removeTabAccessTime, 
  getTabAccessTimes 
} from './utils/storage.js';

// Setup Alarm for Memory Optimization
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('memoryOptimizer', { periodInMinutes: 1 });
});

// Track Tab Access Times
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await updateTabAccessTime(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await updateTabAccessTime(tabId);
    
    // Auto-Group on open if enabled
    const settings = await getSettings();
    if (settings.autoGroupEnabled && !tab.groupId || tab.groupId === -1) {
      await autoGroupTabs();
    }
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await removeTabAccessTime(tabId);
});

// Auto-group function
export async function autoGroupTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  if (tabs.length === 0) return;
  
  const currentWindowId = tabs[0].windowId;
  const existingGroups = await chrome.tabGroups.query({ windowId: currentWindowId });
  
  const groupsToCreate = {}; // { catName: { color: 'blue', tabs: [] } }

  tabs.forEach(tab => {
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.groupId !== -1) {
      return;
    }
    const { title, color } = categorizeTab(tab.url, tab.title || '');
    if (!groupsToCreate[title]) {
      groupsToCreate[title] = { color, tabs: [] };
    }
    groupsToCreate[title].tabs.push(tab.id);
  });

  for (const [title, groupInfo] of Object.entries(groupsToCreate)) {
    if (groupInfo.tabs.length > 0) {
      try {
        const existingGroup = existingGroups.find(g => g.title === title);
        const groupOptions = { tabIds: groupInfo.tabs };
        if (existingGroup) {
          groupOptions.groupId = existingGroup.id;
        }

        const groupId = await chrome.tabs.group(groupOptions);
        await chrome.tabGroups.update(groupId, { title, color: groupInfo.color });
      } catch (e) {
        console.error(`Failed to group tabs for ${title}:`, e);
      }
    }
  }
}

// Memory Optimizer logic (Freezing tabs)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'memoryOptimizer') {
    const settings = await getSettings();
    if (!settings.autoFreezeEnabled) return;

    const tabs = await chrome.tabs.query({ 
      active: false, 
      audible: false, 
      pinned: false,
      discarded: false 
    });
    const accessTimes = await getTabAccessTimes();
    const now = Date.now();
    const thresholdMs = settings.freezeThresholdMinutes * 60 * 1000;

    for (const tab of tabs) {
      // Don't freeze protected URLs
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
      
      const isWhitelisted = settings.whitelistDomains.some(d => tab.url.includes(d));
      if (isWhitelisted) continue;

      const lastAccess = accessTimes[tab.id];
      // If we don't have a record, set it now.
      if (!lastAccess) {
        await updateTabAccessTime(tab.id);
        continue;
      }

      if (now - lastAccess >= thresholdMs) {
        try {
          console.log(`Freezing inactive tab: ${tab.title} (${tab.id})`);
          await chrome.tabs.discard(tab.id);
        } catch (e) {
          console.error(`Error discarding tab ${tab.id}:`, e);
        }
      }
    }
  }
});
