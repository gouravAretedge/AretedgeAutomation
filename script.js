let GITHUB_TOKEN = '';

// Attach event listener to the test cases table for Run buttons
document.getElementById('run-tc1').addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
        const row = event.target.closest('tr'); // Find the closest table row
        const testCaseId = row.querySelector('input[name="test-case-select"]').value; // Get the test case ID
        triggerWorkflow({ test_case_id: testCaseId }); // Trigger workflow with the test case ID
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

    const testCaseId = selectedRadio.value; // Get the selected test case ID
    triggerWorkflow({ test_case_id: testCaseId }); // Pass the correct input
});

document.getElementById('set-config').addEventListener('click', () => {
    const token = document.getElementById('github-token').value;
    if (token) {
        localStorage.setItem('githubToken', token);
        GITHUB_TOKEN = token;
        alert('GitHub token saved!');
    } else {
        alert('Please enter a valid token.');
    }
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
    const owner = 'gouravAretedge'; // Replace with your GitHub username or organization
    const repo = 'AretedgeAutomationDemo'; // Replace with your repository name
    const workflowId = 'ci.yml'; // The name of your workflow file in `.github/workflows`
    const ref = 'main'; // The branch or tag to run the workflow on

    fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`, // Ensure GITHUB_TOKEN is correctly set
            Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
            ref: ref, // The branch or tag name
            inputs: {
                testClass: 'com.aretedge.MyTestClass'  // Replace with the desired test class
            }
        }),
    })
        .then(response => {
            if (response.ok) {
                alert('Workflow triggered successfully!');
            } else {
                return response.json().then(err => {
                    console.error('Error triggering workflow:', err);
                    alert(`Failed to trigger workflow: ${err.message}`);
                });
            }
        })
        .catch(err => {
            console.error('Network error:', err);
            alert('Failed to connect to GitHub API');
        });
}


// Retrieve token from local storage on load
const savedToken = localStorage.getItem('githubToken');
if (savedToken) {
    GITHUB_TOKEN = savedToken;
    document.getElementById('github-token').value = savedToken;
}

document.getElementById('set-config').addEventListener('click', () => {
    const numThreadsInput = document.getElementById('num-threads');
    const numThreads = parseInt(numThreadsInput.value, 10); // Get the value and convert to an integer

    if (isNaN(numThreads) || numThreads < 1) {
        alert('Please enter a valid number of threads (1 or more).');
        return;
    }

    // Save the number of threads or use it in your application logic
    console.log(`Number of threads set: ${numThreads}`);
    alert(`Number of threads set to: ${numThreads}`);
    setNumberOfThreads( numThreads ); // Pass the correct input
});

function setNumberOfThreads(param) {
    
    //param = parseInt(param, 10);
    alert(`Before: Number of threads set to: ${param}`);
    console.log(`Number of threads set Before: ${param}`);
    // Validate `param`
    if (!param || isNaN(param) || parseInt(param, 10) < 1) {
        alert('Invalid number of threads. Please provide a positive integer.');
        return;
    }
    

    const owner = 'gouravAretedge'; // Replace with your GitHub username or organization
    const repo = 'AretedgeAutomationDemo'; // Replace with your repository name
    const workflowId = 'ci.yml'; // The name of your workflow file in `.github/workflows`
    const ref = 'main'; // The branch or tag to run the workflow on

    // Ensure GITHUB_TOKEN is set
    // const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''; // Adjust to your environment
    
    // if (!GITHUB_TOKEN) {
    //     alert('GitHub token is not set. Please configure it.');
    //     return;
    // }

    alert(`After: Number of threads set to: ${param}`);

    // Call GitHub API to dispatch the workflow
    fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`, // Ensure GITHUB_TOKEN is correctly set
            Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
            ref: ref, // The branch or tag name
            inputs: {
                threads: param.toString(), // Convert to string explicitly
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
            alert('Failed to connect to GitHub API. Please check your internet connection or GitHub configuration.');
        });
}


