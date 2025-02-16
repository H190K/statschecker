async function fetchWebsitesStatus() {
    const statusList = document.getElementById('status-list');
    try {
        const response = await fetch('websites.txt');
        const text = await response.text();
        const websites = text.split('\n').map(website => website.trim()).filter(Boolean);
        
        statusList.innerHTML = ''; // Clear existing content
        
        const checkPromises = websites.map(async (website) => {
            const statusItem = document.createElement('div');
            statusItem.className = 'status-item';
            
            // Create clickable link
            const websiteLink = document.createElement('a');
            websiteLink.href = website.startsWith('http') ? website : `https://${website}`;
            websiteLink.target = '_blank';
            websiteLink.textContent = website;
            
            // Create status text element
            const statusText = document.createElement('span');
            statusText.className = 'status-text';
            statusText.textContent = 'Checking...';
            
            // Append elements
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
                
                // Add error info if available
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
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchWebsitesStatus();
    
    // Add refresh button functionality
    const refreshButton = document.getElementById('refreshButton');
    refreshButton.addEventListener('click', () => {
        fetchWebsitesStatus();
    });
});
