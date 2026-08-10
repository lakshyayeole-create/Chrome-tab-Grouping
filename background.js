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
    
    // Auto-Group on open or URL change if enabled
    const settings = await getSettings();
    if (settings.autoGroupEnabled) {
      await autoGroupTabs(tab.windowId);
    }
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await removeTabAccessTime(tabId);
});

// Auto-group function (handles new tabs & dynamic re-grouping on URL change)
export async function autoGroupTabs(windowId = null) {
  const queryOptions = windowId ? { windowId } : { currentWindow: true };
  const tabs = await chrome.tabs.query(queryOptions);
  if (tabs.length === 0) return;
  
  const targetWindowId = tabs[0].windowId;
  const existingGroups = await chrome.tabGroups.query({ windowId: targetWindowId });
  
  const groupTitleMap = {};
  existingGroups.forEach(g => {
    groupTitleMap[g.id] = g.title;
  });

  const groupsToCreate = {}; // { catName: { color: 'orange', tabs: [] } }

  tabs.forEach(tab => {
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }
    const { title, color } = categorizeTab(tab.url, tab.title || '');
    
    // Check if the tab is already in the matching category group
    const currentGroupTitle = (tab.groupId !== -1 && tab.groupId !== undefined) ? groupTitleMap[tab.groupId] : null;
    if (currentGroupTitle === title) {
      return;
    }

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
