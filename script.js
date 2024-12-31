document.addEventListener('DOMContentLoaded', async () => {
    const statusList = document.getElementById('status-list');

    try {
        const response = await fetch('websites.txt');
        const text = await response.text();
        const websites = text.split('\n').map(website => website.trim()).filter(Boolean);

        statusList.innerHTML = ''; // Clear loading message

        for (const website of websites) {
            const statusItem = document.createElement('div');
            statusItem.className = 'status-item';
            statusItem.innerHTML = `
                <span>${website}</span>
                <span>Checking...</span>
            `;
            statusList.appendChild(statusItem);

            try {
                const pingResponse = await fetch(website);
                if (pingResponse.ok) {
                    statusItem.querySelector('span:last-child').textContent = 'Online';
                    statusItem.querySelector('span:last-child').className = 'online';
                } else {
                    throw new Error('Response not OK');
                }
            } catch {
                statusItem.querySelector('span:last-child').textContent = 'Offline';
                statusItem.querySelector('span:last-child').className = 'offline';
            }
        }
    } catch (err) {
        statusList.innerHTML = `<p>Error loading websites: ${err.message}</p>`;
    }
});