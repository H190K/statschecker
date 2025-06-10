const REFRESH_INTERVAL_SECONDS = 60;
let countdownInterval;
let nextRefreshTime = 0;

function updateSummaryStats(total, operational, issues) {
    document.getElementById('total-systems').textContent = total;
    document.getElementById('operational-systems').textContent = operational;
    document.getElementById('issue-systems').textContent = issues;
}

function updateCountdownDisplay(secondsRemaining) {
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
        countdownElement.textContent = secondsRemaining;
    }
}

function startCountdown() {
    clearInterval(countdownInterval);

    const storedNextRefreshTime = parseInt(localStorage.getItem('nextRefreshTime'), 10);
    const currentTime = Math.floor(Date.now() / 1000);

    if (storedNextRefreshTime && storedNextRefreshTime > currentTime) {
        nextRefreshTime = storedNextRefreshTime;
    } else {
        nextRefreshTime = currentTime + REFRESH_INTERVAL_SECONDS;
        localStorage.setItem('nextRefreshTime', nextRefreshTime);
    }

    let secondsRemaining = nextRefreshTime - currentTime;
    updateCountdownDisplay(secondsRemaining);

    countdownInterval = setInterval(() => {
        secondsRemaining--;
        if (secondsRemaining >= 0) {
            updateCountdownDisplay(secondsRemaining);
        } else {
            clearInterval(countdownInterval);
            fetchWebsitesStatus();
        }
    }, 1000);
}

async function fetchWebsitesStatus() {
    const statusList = document.getElementById('status-list');
    const refreshButton = document.getElementById('refreshButton');
    if(refreshButton) refreshButton.disabled = true;
    if(statusList) statusList.innerHTML = '<p class="loading-text">Loading website statuses...</p>';

    try {
        const response = await fetch('websites.txt');
        const text = await response.text();
        const websites = text.split('\n').map(website => website.trim()).filter(Boolean);
        
        if(statusList) statusList.innerHTML = '';
        
        let operationalCount = 0;
        let issuesCount = 0;
        
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
                    operationalCount++;
                } else {
                    throw new Error('Response not OK');
                }
            } catch (error) {
                statusItem.classList.add('offline');
                statusText.textContent = 'Not Operational';
                issuesCount++;
                
                if (error.message) {
                    const errorInfo = document.createElement('span');
                    errorInfo.className = 'error-info';
                    errorInfo.textContent = `(${error.message})`;
                    statusText.appendChild(errorInfo);
                }
            }
        });
        
        await Promise.all(checkPromises);
        updateSummaryStats(websites.length, operationalCount, issuesCount);
    } catch (err) {
        if(statusList) statusList.innerHTML = `
            <div class="error-message">
                Error loading websites: ${err.message}
            </div>
        `;
        updateSummaryStats(0, 0, 0);
    } finally {
        if(refreshButton) refreshButton.disabled = false;
        const currentTime = Math.floor(Date.now() / 1000);
        nextRefreshTime = currentTime + REFRESH_INTERVAL_SECONDS;
        localStorage.setItem('nextRefreshTime', nextRefreshTime);
        startCountdown();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Start the countdown and fetch initial status
    startCountdown();
    fetchWebsitesStatus();
    
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            clearInterval(countdownInterval);
            fetchWebsitesStatus();
        });
    }
});
