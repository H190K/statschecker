async function fetchWebsitesStatus() {
    const statusList = document.getElementById('status-list');
    try {
        const response = await fetch('websites.txt');
        const text = await response.text();
        const websites = text.split('\n').map(website => website.trim()).filter(Boolean);
        statusList.innerHTML = ''; // Clear existing content
        websites.forEach(async (website) => {
            const statusItem = document.createElement('div');
            statusItem.className = 'status-item';
            // Create clickable link
            const websiteLink = document.createElement('a');
            websiteLink.href = website;
            websiteLink.target = '_blank'; // Open in a new tab
            websiteLink.textContent = website;
            // Append website and checking status
            statusItem.appendChild(websiteLink);
            const statusText = document.createElement('span');
            statusText.textContent = 'Checking...';
            statusItem.appendChild(statusText);
            statusList.appendChild(statusItem);
            try {
                // Use GET request instead of HEAD
                const pingResponse = await fetch(website, { method: 'GET', mode: 'no-cors' });
                if (pingResponse.ok || pingResponse.type === 'opaque') {
                    statusItem.classList.add('online');
                    statusText.textContent = 'Operational';
                } else {
                    throw new Error('Response not OK');
                }
            } catch {
                statusItem.classList.add('offline');
                statusText.textContent = 'Not Operational';
            }
        });
    } catch (err) {
        statusList.innerHTML = `<p>Error loading websites: ${err.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchWebsitesStatus();
});
