let GITHUB_TOKEN = '';

document.getElementById('load-tests').addEventListener('click', loadTestCases);
document.getElementById('run-suite').addEventListener('click', () => {
    if (!GITHUB_TOKEN) {
        alert('Please set a GitHub token first!');
        return;
    }
    triggerWorkflow({ test_suite: true });
});

document.getElementById('set-token').addEventListener('click', () => {
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
    fetch(`https://api.github.com/repos/your-github-username/your-repo-name/actions/workflows/automation.yml/dispatches`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
            ref: 'main',
            inputs: inputs,
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
