import { getSettings, saveSettings } from './utils/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await getSettings();
  
  document.getElementById('auto-group-toggle').checked = settings.autoGroupEnabled;
  document.getElementById('auto-freeze-toggle').checked = settings.autoFreezeEnabled;
  document.getElementById('freeze-threshold').value = settings.freezeThresholdMinutes;
  document.getElementById('whitelist-domains').value = settings.whitelistDomains.join(', ');

  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    const newSettings = {
      autoGroupEnabled: document.getElementById('auto-group-toggle').checked,
      autoFreezeEnabled: document.getElementById('auto-freeze-toggle').checked,
      freezeThresholdMinutes: parseInt(document.getElementById('freeze-threshold').value, 10),
      whitelistDomains: document.getElementById('whitelist-domains').value
                          .split(',')
                          .map(d => d.trim())
                          .filter(d => d.length > 0)
    };

    await saveSettings(newSettings);
    
    const statusEl = document.getElementById('save-status');
    statusEl.textContent = 'Settings saved successfully!';
    setTimeout(() => {
      statusEl.textContent = '';
    }, 3000);
  });
});
