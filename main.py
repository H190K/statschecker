from flask import Flask, render_template_string, jsonify
import requests
import time
from concurrent.futures import ThreadPoolExecutor
from threading import Thread

app = Flask(__name__)

# Store the results in a global variable
results = {}
countdown = 60  # Countdown in seconds

# Read the websites from the file
def read_websites():
    with open("websites.txt", "r") as file:
        return [line.strip() for line in file.readlines()]

# Check if the website is alive and return the status
def check_website(url):
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            results[url] = f"Success"
        else:
            results[url] = f"Failed ({response.status_code})"
    except requests.exceptions.RequestException:
        results[url] = "Failed (No Response)"

# Function to check websites concurrently using threads
def check_websites_concurrently(websites):
    with ThreadPoolExecutor() as executor:
        # Map the check_website function to the list of websites
        executor.map(check_website, websites)

# Function to check websites periodically every 60 seconds
def check_websites_periodically():
    global countdown
    while True:
        websites = read_websites()

        # Check websites concurrently
        check_websites_concurrently(websites)

        # Countdown before the next check
        for i in range(countdown, 0, -1):
            time.sleep(1)

@app.route('/')
def home():
    # Check websites immediately when the page loads
    websites = read_websites()

    # Initialize results with the current status of websites
    for website in websites:
        if website not in results:
            results[website] = "Checking..."

    # Run the checking function to update the statuses
    check_websites_concurrently(websites)

    # Render the webpage with the results
    return render_template_string("""
        <html>
            <head>
                <title>Website Check Results</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #1c1c1e;
                        color: white;
                        margin: 0;
                        padding: 0;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                    h1 {
                        font-size: 3rem;
                        margin-bottom: 20px;
                        color: #ffffff;
                    }
                    #results {
                        margin-top: 20px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        width: 80%;
                        max-width: 600px;
                        text-align: center;
                    }
                    .website-status {
                        padding: 15px;
                        margin: 10px 0;
                        border-radius: 12px;
                        font-size: 1.2rem;
                        width: 100%;
                        transition: all 0.3s ease;
                    }
                    .success {
                        background: #34c759;
                        color: white;
                    }
                    .failed {
                        background: #ff3b30;
                        color: white;
                    }
                    .checking {
                        background: #ffcc00;
                        color: black;
                    }
                    .countdown {
                        font-size: 1.5rem;
                        color: #8e8e93;
                        margin-top: 20px;
                    }
                    button {
                        margin-top: 20px;
                        background-color: #007aff;
                        color: white;
                        padding: 12px 25px;
                        font-size: 1rem;
                        border: none;
                        border-radius: 12px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }
                    button:hover {
                        background-color: #0051a8;
                    }
                    .status-text {
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <h1>Website Check Results</h1>
                <div id="results">
                    {% for url, status in results.items() %}
                        <div class="website-status {% if status == 'Success' %}success{% elif status == 'Failed' %}failed{% else %}checking{% endif %}">
                            <p class="status-text">{{ url }} - {{ status }}</p>
                        </div>
                    {% endfor %}
                </div>
                <div class="countdown">
                    Next check in: <span id="countdown">{{ countdown }}</span> seconds
                </div>
                <button onclick="refreshResults()">Refresh Status</button>
                <script>
                    function refreshResults() {
                        fetch('/results')
                        .then(response => response.json())
                        .then(data => {
                            let resultsDiv = document.getElementById("results");
                            resultsDiv.innerHTML = "";
                            for (let url in data) {
                                let statusClass = '';
                                let statusText = data[url];
                                if (statusText.includes("Success")) {
                                    statusClass = 'success';
                                } else if (statusText.includes("Failed")) {
                                    statusClass = 'failed';
                                } else {
                                    statusClass = 'checking';
                                }

                                let div = document.createElement("div");
                                div.classList.add("website-status", statusClass);
                                div.innerHTML = `<p class="status-text">${url} - ${statusText}</p>`;
                                resultsDiv.appendChild(div);
                            }
                        });
                    }

                    function updateCountdown() {
                        let countdownElement = document.getElementById("countdown");
                        let countdownValue = parseInt(countdownElement.innerText);
                        if (countdownValue > 0) {
                            countdownValue--;
                            countdownElement.innerText = countdownValue;
                        } else {
                            countdownElement.innerText = 60;
                        }
                    }

                    setInterval(updateCountdown, 1000); // Update countdown every second
                    setInterval(refreshResults, 60000); // Refresh every 60 seconds
                </script>
            </body>
        </html>
    """, results=results, countdown=countdown)

@app.route('/results')
def get_results():
    # Return the status of websites as JSON
    return jsonify(results)

@app.route('/start')
def start_checking():
    # Start the website checking process in a separate thread
    thread = Thread(target=check_websites_periodically)
    thread.daemon = True  # Allows thread to exit when the main program ends
    thread.start()
    return "Started checking websites every 60 seconds."

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)
