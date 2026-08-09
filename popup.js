import { autoGroupTabs } from './background.js';
import { createStash } from './utils/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  await renderDashboard();

  document.getElementById('btn-group-tabs').addEventListener('click', async () => {
    await autoGroupTabs();
    await renderDashboard();
  });

  document.getElementById('btn-freeze-all').addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ active: false, discarded: false });
    for (const tab of tabs) {
      if (!tab.url.startsWith('chrome://')) {
        await chrome.tabs.discard(tab.id);
      }
    }
    await renderDashboard();
  });

  document.getElementById('btn-stash-all').addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const name = `Session ${new Date().toLocaleString()}`;
    await createStash(name, tabs);
    // Optionally close tabs except active one
    alert('Stashed all tabs in current window!');
  });
});

async function renderDashboard() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  
  let openCount = tabs.length;
  let frozenCount = tabs.filter(t => t.discarded).length;
  // Estimate 50MB per discarded tab
  let memorySaved = frozenCount * 50;

  document.getElementById('open-tabs-count').textContent = openCount;
  document.getElementById('frozen-tabs-count').textContent = frozenCount;
  document.getElementById('memory-saved').textContent = `${memorySaved} MB`;

  const listEl = document.getElementById('tab-list');
  listEl.innerHTML = '';

  tabs.forEach(tab => {
    const item = document.createElement('div');
    item.className = `tab-item ${tab.discarded ? 'discarded' : ''}`;
    
    const icon = tab.favIconUrl ? `<img src="${tab.favIconUrl}" alt="icon">` : `<div style="width:16px;height:16px;background:#334155;border-radius:2px;"></div>`;
    const url = new URL(tab.url || 'chrome://newtab');
    const domain = url.hostname;

    item.innerHTML = `
      ${icon}
      <div class="tab-info">
        <span class="tab-title">${tab.title || tab.url}</span>
        <span class="tab-domain">${domain}</span>
      </div>
      ${tab.discarded ? '<span class="freeze-badge">Frozen</span>' : ''}
    `;
    listEl.appendChild(item);
  });
}
