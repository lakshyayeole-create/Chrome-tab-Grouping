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
    
    const icon = tab.favIconUrl 
      ? `<img src="${tab.favIconUrl}" class="tab-icon" alt="icon">` 
      : `<svg class="tab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg>`;

    const title = tab.title || tab.url || 'New Tab';
    const urlStr = tab.url || '';

    item.innerHTML = `
      <input type="checkbox" class="tab-checkbox" ${tab.active ? 'checked' : ''}>
      ${icon}
      <div class="tab-info">
        <span class="tab-title">${escapeHtml(title)}</span>
        <span class="tab-url">${escapeHtml(urlStr)}</span>
      </div>
      <div class="tab-actions">
        ${tab.active ? '<span class="badge active-badge">Active for 15s</span>' : (tab.discarded ? '<span class="badge frozen-badge">Frozen</span>' : '')}
        <button class="btn-close-tab" title="Close Tab" data-id="${tab.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `;

    // Click item to switch active tab
    item.addEventListener('click', (e) => {
      if (e.target.closest('.btn-close-tab') || e.target.closest('.tab-checkbox')) return;
      chrome.tabs.update(tab.id, { active: true });
    });

    // Close button listener
    const closeBtn = item.querySelector('.btn-close-tab');
    closeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await chrome.tabs.remove(tab.id);
      await renderDashboard();
    });

    listEl.appendChild(item);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
