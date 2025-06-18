const REFRESH_INTERVAL_SECONDS = 60;
let countdownInterval;
let nextRefreshTime = 0;

function updateSummaryStats(total, operational, issues) {
    const totalElement = document.getElementById('total-systems');
    const operationalElement = document.getElementById('operational-systems');
    const issuesElement = document.getElementById('issue-systems');
    
    if (totalElement) totalElement.textContent = total;
    if (operationalElement) operationalElement.textContent = operational;
    if (issuesElement) issuesElement.textContent = issues;
}

function updateCountdownDisplay(secondsRemaining) {
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
        countdownElement.textContent = Math.max(0, secondsRemaining);
    }
}

function startCountdown() {
    clearInterval(countdownInterval);
    const storedNextRefreshTime = parseInt(localStorage.getItem('nextRefreshTime'), 10);
    const currentTime = Math.floor(Date.now() / 1000);
    
    nextRefreshTime = (storedNextRefreshTime && storedNextRefreshTime > currentTime) 
        ? storedNextRefreshTime 
        : currentTime + REFRESH_INTERVAL_SECONDS;
    
    localStorage.setItem('nextRefreshTime', nextRefreshTime);
    updateCountdownDisplay(nextRefreshTime - currentTime);
    
    countdownInterval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const secondsRemaining = nextRefreshTime - now;
        
        if (secondsRemaining >= 0) {
            updateCountdownDisplay(secondsRemaining);
        } else {
            clearInterval(countdownInterval);
            fetchWebsitesStatus(true); // true = auto-refresh
        }
    }, 1000);
}

async function fetchWebsitesStatus(isAutoRefresh = false) {
    const statusList = document.getElementById('status-list');
    const refreshButton = document.getElementById('refreshButton');
    
    if (refreshButton) refreshButton.disabled = true;
    if (statusList) statusList.innerHTML = '<p class="loading-text">Loading website statuses...</p>';

    try {
        const response = await fetch('websites.txt', {cache: 'no-store'}); // Added cache control
        if (!response.ok) throw new Error('Failed to fetch websites list');
        
        const text = await response.text();
        const websites = text.split('\n')
            .map(website => website.trim())
            .filter(website => website && !website.startsWith('#')); // Skip empty lines and comments
        
        if (statusList) statusList.innerHTML = '';
        
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
            if (statusList) statusList.appendChild(statusItem);
            
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const pingResponse = await fetch(websiteLink.href, { 
                    method: 'GET', 
                    mode: 'no-cors',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
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
                    errorInfo.textContent = `(${error.name === 'AbortError' ? 'Timeout' : error.message})`;
                    statusText.appendChild(errorInfo);
                }
            }
        });
        
        await Promise.all(checkPromises);
        updateSummaryStats(websites.length, operationalCount, issuesCount);
    } catch (err) {
        if (statusList) {
            statusList.innerHTML = `
                <div class="error-message">
                    Error loading websites: ${err.message}
                </div>
            `;
        }
        updateSummaryStats(0, 0, 0);
    } finally {
        if (refreshButton) refreshButton.disabled = false;
        if (isAutoRefresh) {
            const currentTime = Math.floor(Date.now() / 1000);
            nextRefreshTime = currentTime + REFRESH_INTERVAL_SECONDS;
            localStorage.setItem('nextRefreshTime', nextRefreshTime);
        }
        startCountdown();
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme); // Changed from body to documentElement
    updateToggleIcon(savedTheme);
}

function updateToggleIcon(theme) {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.textContent = theme === 'dark' ? '🌙' : '☀️';
        toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateToggleIcon(newTheme);
        });
    }
    
    startCountdown();
    fetchWebsitesStatus();
    
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            clearInterval(countdownInterval);
            localStorage.removeItem('nextRefreshTime');
            fetchWebsitesStatus();
            
            const currentTime = Math.floor(Date.now() / 1000);
            nextRefreshTime = currentTime + REFRESH_INTERVAL_SECONDS;
            localStorage.setItem('nextRefreshTime', nextRefreshTime);
            startCountdown();
        });
    }
});

window.addEventListener('beforeunload', () => {
    if (!localStorage.getItem('nextRefreshTime')) {
        const currentTime = Math.floor(Date.now() / 1000);
        localStorage.setItem('nextRefreshTime', currentTime + REFRESH_INTERVAL_SECONDS);
    }
});
