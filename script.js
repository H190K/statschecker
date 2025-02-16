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
            websiteLink.target = '_blank';
            websiteLink.textContent = website;
            
            // Create status indicator
            const statusText = document.createElement('span');
            statusText.textContent = 'Checking...';
            
            // Append elements
            statusItem.appendChild(websiteLink);
            statusItem.appendChild(statusText);
            statusList.appendChild(statusItem);
            
            try {
                // First try with fetch
                try {
                    const pingResponse = await fetch(website, {
                        method: 'GET',
                        mode: 'no-cors',
                        cache: 'no-cache'
                    });
                    
                    // If we get here, the site is likely up
                    statusItem.classList.add('online');
                    statusText.textContent = 'Operational';
                    return;
                } catch (fetchError) {
                    // If fetch fails, try with image load technique
                    const img = new Image();
                    
                    // Create a promise that resolves when the image loads
                    // or rejects when it fails
                    const imageLoadPromise = new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        
                        // Add timestamp to bypass cache
                        img.src = `${website}/favicon.ico?t=${Date.now()}`;
                        
                        // Set timeout for 5 seconds
                        setTimeout(reject, 5000);
                    });
                    
                    await imageLoadPromise;
                    statusItem.classList.add('online');
                    statusText.textContent = 'Operational';
                }
            } catch (error) {
                // If all checks fail, mark as offline
                statusItem.classList.add('offline');
                statusText.textContent = 'Not Operational';
                
                // Add more detailed error info
                const errorInfo = document.createElement('span');
                errorInfo.className = 'error-info';
                errorInfo.textContent = ' (CORS Protected)';
                statusText.appendChild(errorInfo);
            }
        });
    } catch (err) {
        statusList.innerHTML = `<p>Error loading websites: ${err.message}</p>`;
    }
}

// Add some debouncing to prevent too frequent checks
let checkTimeout;
function debouncedCheck() {
    clearTimeout(checkTimeout);
    checkTimeout = setTimeout(fetchWebsitesStatus, 300);
}

document.addEventListener('DOMContentLoaded', fetchWebsitesStatus);

// Add manual refresh button
const refreshButton = document.createElement('button');
refreshButton.textContent = 'Refresh Status';
refreshButton.className = 'refresh-button';
refreshButton.onclick = debouncedCheck;
document.querySelector('header').appendChild(refreshButton);
