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
