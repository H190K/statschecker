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
            statusItem.innerHTML = `
                <span>${website}</span>
                <span>Checking...</span>
            `;
            statusList.appendChild(statusItem);

            try {
                const pingResponse = await fetch(website, { method: 'HEAD' });
                if (pingResponse.ok) {
                    statusItem.classList.add('online');
                    statusItem.querySelector('span:last-child').textContent = 'Operational';
                } else {
                    throw new Error('Response not OK');
                }
            } catch {
                statusItem.classList.add('offline');
                statusItem.querySelector('span:last-child').textContent = 'Not Operational';
            }
        });
    } catch (err) {
        statusList.innerHTML = `<p>Error loading websites: ${err.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchWebsitesStatus();
});
