// GitHub API URL and authentication
const apiUrl = "https://api.github.com/repos/gouravAretedge/AretedgeAutomationDemo/contents/Extent.html";
let GITHUB_TOKEN = localStorage.getItem('githubToken');
let THREAD_COUNT = localStorage.getItem('threads_count');

// View Extent.html details in a new tab
function viewDetails() {
    if (!GITHUB_TOKEN) {
        alert("GitHub token not found. Please set it in the configuration.");
        return;
    }

    fetch(apiUrl, {
        method: "GET",
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3.raw"
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to fetch details. HTTP status: ${response.status}`);
        }
        return response.text();
    })
    .then(htmlContent => {
        const detailWindow = window.open("", "_blank");
        detailWindow.document.open();
        detailWindow.document.write(htmlContent);
        detailWindow.document.close();
    })
    .catch(error => {
        console.error("Error fetching details:", error);
        alert("Failed to fetch details: " + error.message);
    });
}

// Fetch and populate test results
function fetchTestResults() {
    const testResultsApiUrl = "https://api.github.com/repos/gouravAretedge/AretedgeAutomationDemo/contents/test-results.json";

    fetch(testResultsApiUrl, {
        method: "GET",
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json"
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const decodedContent = atob(data.content);
        const jsonContent = JSON.parse(decodedContent);
        console.log("Test Results:", jsonContent);
        populateReportTable(jsonContent);
    })
    .catch(error => {
        console.error("Error fetching file:", error);
        document.querySelector("#test-results-table tbody").innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">Failed to load results: ${error.message}</td>
            </tr>`;
    });
}

// Populate the test results table
function populateReportTable(data) {
    const tableBody = document.querySelector("#test-results-table tbody");
    tableBody.innerHTML = ""; // Clear previous data

    const latestResults = data.slice(-10);

    latestResults.forEach(test => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${test.testCaseId}</td>
            <td>${test.description}</td>
            <td>${test.status}</td>
            <td>${test.executionTime || "N/A"}</td>
            <td>
                <button class="details-btn">View Details</button>
            </td>`;
        tableBody.appendChild(row);
    });

    if (latestResults.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">No results available.</td>
            </tr>`;
    }

    // Attach event listeners to "View Details" buttons
    document.querySelectorAll(".details-btn").forEach(button => {
        button.addEventListener("click", () => {
            viewDetails();
        });
    });
}

// Save GitHub token and thread count
function saveConfig() {
    const token = document.getElementById("github-token").value;
    const threadCount = parseInt(document.getElementById("num-threads").value, 10);

    if (!token) {
        alert("Please enter a valid GitHub token.");
        return;
    }

    if (isNaN(threadCount) || threadCount < 1) {
        alert("Please enter a valid thread count (1 or more).");
        return;
    }

    localStorage.setItem("githubToken", token);
    localStorage.setItem("threads_count", threadCount);
    GITHUB_TOKEN = token;
    THREAD_COUNT = threadCount;

    alert("Configuration saved successfully!");
}

// Execute a test case
function executeTestCase(param, className) {
    if (!GITHUB_TOKEN) {
        alert("GitHub token not set. Please configure it first.");
        return;
    }

    fetch(`https://api.github.com/repos/gouravAretedge/AretedgeAutomationDemo/actions/workflows/ci.yml/dispatches`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
            ref: "main",
            inputs: {
                threads: param.toString(),
                testClass: className.toString(),
            },
        }),
    })
    .then(response => {
        if (response.ok) {
            alert("Workflow triggered successfully!");
        } else {
            return response.json().then(err => {
                console.error("Error triggering workflow:", err);
                alert(`Failed to trigger workflow: ${err.message || "Unknown error"}`);
            });
        }
    })
    .catch(err => {
        console.error("Network error:", err);
        alert("Failed to connect to GitHub API.");
    });
}

// Load configurations from localStorage
document.addEventListener("DOMContentLoaded", () => {
    const savedToken = localStorage.getItem("githubToken");
    if (savedToken) {
        GITHUB_TOKEN = savedToken;
        document.getElementById("github-token").value = savedToken;
    }

    const savedThreads = localStorage.getItem("threads_count");
    if (savedThreads) {
        THREAD_COUNT = savedThreads;
        document.getElementById("num-threads").value = savedThreads;
    }

    // Fetch and display test results on page load
    fetchTestResults();
});

// Event listeners for configuration save and test case execution
document.getElementById("set-config").addEventListener("click", saveConfig);
document.getElementById("run-tc1").addEventListener("click", () => {
    executeTestCase(THREAD_COUNT, "ValidateLogin");
});
document.getElementById("run-suite").addEventListener("click", () => {
    executeTestCase(THREAD_COUNT, "TestSuite");
});
