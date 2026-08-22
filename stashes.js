import { getStashes, deleteStash } from './utils/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  await renderStashes();
});

async function renderStashes() {
  const stashes = await getStashes();
  const listEl = document.getElementById('stashes-list');
  listEl.innerHTML = '';

  if (stashes.length === 0) {
    listEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin-top: 20px;">No saved stashes yet.</p>';
    return;
  }

  stashes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(stash => {
    const card = document.createElement('div');
    card.className = 'stash-card';

    const dateStr = new Date(stash.createdAt).toLocaleString();

    card.innerHTML = `
      <div class="stash-header">
        <span class="stash-title">${stash.name}</span>
        <span class="stash-date">${dateStr}</span>
      </div>
      <div class="stash-meta">
        ${stash.tabs.length} tabs saved
      </div>
      <div class="stash-actions">
        <button class="btn-restore" data-id="${stash.id}">Restore</button>
        <button class="btn-delete" data-id="${stash.id}">Delete</button>
      </div>
    `;

    listEl.appendChild(card);
  });

  document.querySelectorAll('.btn-restore').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      const stashToRestore = stashes.find(s => s.id === id);
      if (stashToRestore) {
        for (const tab of stashToRestore.tabs) {
          await chrome.tabs.create({ url: tab.url, active: false });
        }
      }
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      await deleteStash(id);
      await renderStashes();
    });
  });
}
