async function fetchWebsitesStatus() {
    const statusList = document.getElementById('status-list');
    const refreshButton = document.getElementById('refreshButton');
    
    refreshButton.disabled = true;
    refreshButton.textContent = 'Checking...';
    
    try {
        // Sample websites (you can replace these with your own)
        const websites = [
            'google.com',
            'github.com',
            'example.com',
            'facebook.com',
            'twitter.com'
        ];
        
        statusList.innerHTML = '';
        
        const checkPromises = websites.map(async (website) => {
            const statusItem = document.createElement('div');
            statusItem.className = 'status-item';
            
            const websiteLink = document.createElement('a');
            websiteLink.href = website.startsWith('http') ? website : `https://${website}`;
            websiteLink.target = '_blank';
            websiteLink.textContent = website;
            
            const statusText = document.createElement('span');
            statusText.className = 'status-text';
            statusText.textContent = 'Checking...';
            
            statusItem.appendChild(websiteLink);
            statusItem.appendChild(statusText);
            statusList.appendChild(statusItem);
            
            try {
                const pingResponse = await fetch(websiteLink.href, { 
                    method: 'GET', 
                    mode: 'no-cors',
                    timeout: 5000
                });
                
                if (pingResponse.ok || pingResponse.type === 'opaque') {
                    statusItem.classList.add('online');
                    statusText.textContent = 'Operational';
                } else {
                    throw new Error('Response not OK');
                }
            } catch (error) {
                statusItem.classList.add('offline');
                statusText.textContent = 'Not Operational';
                
                if (error.message) {
                    const errorInfo = document.createElement('span');
                    errorInfo.className = 'error-info';
                    errorInfo.textContent = `(${error.message})`;
                    statusText.appendChild(errorInfo);
                }
            }
        });
        
        await Promise.all(checkPromises);
    } catch (err) {
        statusList.innerHTML = `
            <div class="error-message">
                Error loading websites: ${err.message}
            </div>
        `;
    } finally {
        refreshButton.disabled = false;
        refreshButton.textContent = 'Refresh Status';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchWebsitesStatus();
    
    const refreshButton = document.getElementById('refreshButton');
    refreshButton.addEventListener('click', () => {
        fetchWebsitesStatus();
    });
});
