let GITHUB_TOKEN = '';
let THREAD_COUNT = '';

// Attach event listener for individual test case "Run" buttons
document.getElementById('run-tc1').addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
        const row = event.target.closest('tr');
        const testCaseId = row.querySelector('input[name="test-case-select"]').value;
        executeTestCase(THREAD_COUNT, "ValidateLogin");
    }
});

// Run Test Suite Event Listener
document.getElementById('run-suite').addEventListener('click', () => {
    if (!GITHUB_TOKEN) {
        alert('Please set a GitHub token first!');
        return;
    }

    const selectedRadio = document.querySelector('input[name="test-case-select"]:checked');
    if (!selectedRadio) {
        alert('Please select a test case first!');
        return;
    }

    const testCaseId = selectedRadio.value;
    triggerWorkflow({ test_case_id: testCaseId });
});

function loadTestCases() {
    const fileUpload = document.getElementById('file-upload').files[0];
    if (!fileUpload) {
        alert('Please upload a file first!');
        return;
    }
    readExcel(fileUpload, populateTestCases);
}

function populateTestCases(data) {
    const tableBody = document.querySelector('#test-cases-table tbody');
    tableBody.innerHTML = ''; // Clear previous data

    data.forEach((testCase, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${testCase['Test Case ID']}</td>
            <td>${testCase['Description']}</td>
            <td>${testCase['Status'] || 'Not Run'}</td>
            <td><button onclick="runTestCase(${index})">Run</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function runTestCase(index) {
    if (!GITHUB_TOKEN) {
        alert('Please set a GitHub token first!');
        return;
    }
    alert(`Triggering GitHub Action for Test Case ${index + 1}`);
    triggerWorkflow({ test_case_id: `TC${index + 1}` });
}

function triggerWorkflow(inputs) {
    const owner = 'gouravAretedge';
    const repo = 'AretedgeAutomationDemo';
    const workflowId = 'ci.yml';
    const ref = 'main';

    fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
            ref: ref,
            inputs: {
                testClass: 'com.aretedge.ValidateLogin',
            },
        }),
    })
        .then(response => {
            if (response.ok) {
                alert('Workflow triggered successfully!');
            } else {
                return response.json().then(err => {
                    console.error('Error triggering workflow:', err);
                    alert(`Failed to trigger workflow: ${err.message || 'Unknown error'}`);
                });
            }
        })
        .catch(err => {
            console.error('Network error:', err);
            alert('Failed to connect to GitHub API');
        });
}

// Retrieve token and thread count from local storage
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('githubToken');
    if (savedToken) {
        GITHUB_TOKEN = savedToken;
        document.getElementById('github-token').value = savedToken;
    }

    const savedThreads = localStorage.getItem('threads_count');
    if (savedThreads) {
        THREAD_COUNT = savedThreads;
        document.getElementById('num-threads').value = savedThreads;
    }
});

// Set Configurations (Token and Thread Count)
document.getElementById('set-config').addEventListener('click', () => {
    const numThreadsInput = document.getElementById('num-threads');
    const numThreads = parseInt(numThreadsInput.value, 10);

    if (isNaN(numThreads) || numThreads < 1) {
        alert('Please enter a valid number of threads (1 or more).');
        return;
    }

    localStorage.setItem('threads_count', numThreads);
    THREAD_COUNT = numThreads;
    console.log(`Number of threads set: ${numThreads}`);
    alert(`Number of threads set to: ${numThreads}`);

    const token = document.getElementById('github-token').value;
    if (token) {
        localStorage.setItem('githubToken', token);
        GITHUB_TOKEN = token;
        alert('GitHub token saved!');
    } else {
        alert('Please enter a valid token.');
    }
});

// Execute Test Case
function executeTestCase(param, className) {
    alert(`Number of threads set: ${param}`);
    if (!param || isNaN(param) || parseInt(param, 10) < 1) {
        alert('Invalid number of threads. Please provide a positive integer.');
        return;
    }

    const owner = 'gouravAretedge';
    const repo = 'AretedgeAutomationDemo';
    const workflowId = 'ci.yml';
    const ref = 'main';

    fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
            ref: ref,
            inputs: {
                threads: param.toString(),
                testClass: className.toString(),
            },
        }),
    })
        .then(response => {
            if (response.ok) {
                alert('Workflow triggered successfully!');
            } else {
                return response.json().then(err => {
                    console.error('Error triggering workflow:', err);
                    alert(`Failed to trigger workflow: ${err.message || 'Unknown error'}`);
                });
            }
        })
        .catch(err => {
            console.error('Network error:', err);
            alert('Failed to connect to GitHub API.');
        });
}

// Event listener for "Run" buttons in the test cases table
document.getElementById('test-cases-table').addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON' && event.target.classList.contains('action-btn')) {
        const row = event.target.closest('tr'); // Find the closest table row
        const statusElement = row.querySelector('.status'); // Get the status span
        const testCaseId = row.querySelector('input[name="test-case-select"]').value; // Test Case ID
        
        // Update the status to "Running..." and disable the button
        statusElement.textContent = 'Running...';
        statusElement.className = 'status running'; // Update class for styling
        event.target.disabled = true;

        // Simulate the test case execution
        simulateTestRun(testCaseId, statusElement, event.target);
    }
});

// Function to simulate the test case execution
function simulateTestRun(testCaseId, statusElement, buttonElement) {
    console.log(`Starting test case: ${testCaseId}`);
    
    // Simulate an API call or workflow execution (example with timeout)
    setTimeout(() => {
        // Update the status to "Completed" and re-enable the button
        statusElement.textContent = 'Completed';
        statusElement.className = 'status completed'; // Update class for styling
        buttonElement.disabled = false;

        console.log(`Test case ${testCaseId} execution completed.`);
    }, 3000); // Simulate a 3-second delay
}

// GitHub API URL and authentication
const apiUrl = "https://api.github.com/repos/gouravAretedge/AretedgeAutomationDemo/contents/test-results.json";
const token = localStorage.getItem('githubToken');

// Fetch file content from GitHub API
function fetchTestResults() {
    fetch(apiUrl, {
        method: "GET",
        headers: {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json"
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
            document.querySelector('#test-results-table tbody').innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center;">Failed to load results: ${error.message}</td>
                </tr>`;
        });
}

// Populate the test results table
function populateReportTable(data) {
    const tableBody = document.querySelector('#test-results-table tbody');
    tableBody.innerHTML = ''; // Clear previous data

    const latestResults = data.slice(-10);

    latestResults.forEach(test => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${test.testCaseId}</td>
            <td>${test.description}</td>
            <td>${test.status}</td>
            <td>${test.executionTime || 'N/A'}</td>
            <td>
                <button class="details-btn" onclick="viewDetails('${test.detailsUrl}')">View Details</button>
            </td>`;
        tableBody.appendChild(row);
    });

    if (latestResults.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">No results available.</td>
            </tr>`;
    }
}

// Open details in a new tab
function viewDetails(url) {
    window.open(url, '_blank');
}

// Call the function when the page loads
window.onload = fetchTestResults;

