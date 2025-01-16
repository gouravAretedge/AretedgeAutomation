// GitHub API Configuration
const owner = "gouravAretedge"; // Replace with your GitHub repo owner
const repo = "GC-Automation"; // Replace with your GitHub repo name
let GITHUB_TOKEN = localStorage.getItem("githubToken");
let THREAD_COUNT = localStorage.getItem("threads_count");

// Global variable to manage pagination and artifacts
let currentPage = 1;
const artifactsPerPage = 10;
let artifacts = []; // Store fetched artifacts here
let testResults = []; // Store fetched test results here
const testCaseIDGlobal = "";

// Helper Functions
const getConfigValue = (key, defaultValue = null) => localStorage.getItem(key) || defaultValue;
const setConfigValue = (key, value) => localStorage.setItem(key, value);
const alertAndLogError = (message, error) => {
    console.error(message, error);
    alert(message);
};

// Initialize Configuration
function loadConfigurations() {
    const savedToken = getConfigValue("githubToken");
    const savedThreads = getConfigValue("threads_count");

    if (savedToken) {
        GITHUB_TOKEN = savedToken;
        document.getElementById("github-token").value = savedToken;
    }

    if (savedThreads) {
        THREAD_COUNT = savedThreads;
        document.getElementById("num-threads").value = savedThreads;
    }
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

    setConfigValue("githubToken", token);
    setConfigValue("threads_count", threadCount);
    GITHUB_TOKEN = token;
    THREAD_COUNT = threadCount;

    alert("Configuration saved successfully!");
}

// Execute a test case
function executeTestCase(param, className, testCaseId) {
    //testCaseIDGlobal = testCaseId;
    if (!GITHUB_TOKEN) {
        alert("GitHub token not set. Please configure it first.");
        return;
    }

    // Update test case status to "Running"
    const statusElement = document.querySelector(`#test-case-${testCaseId} .status`);
    if (statusElement) {
        statusElement.textContent = "Running";
        statusElement.className = "status running"; // Apply running style
    }

    fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/ci.yml/dispatches`, {
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
        .then((response) => {
            if (response.ok) {
                alert("Workflow triggered successfully!");
                // Simulate workflow monitoring and completion
                setTimeout(() => {
                    updateTestCaseStatus(testCaseId, "Completed");
                }, 10000); // Replace with actual monitoring logic
            } else {
                return response.json().then((err) => {
                    alertAndLogError("Error triggering workflow.", err);
                    updateTestCaseStatus(testCaseId, "Failed");
                });
            }
        })
        .catch((err) => {
            alertAndLogError("Network error: Failed to connect to GitHub API.", err);
            updateTestCaseStatus(testCaseId, "Failed");
        });
}

// Update test case status
function updateTestCaseStatus(testCaseId, status) {
    const statusElement = document.querySelector(`#test-case-${testCaseId} .status`);
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = `status ${status.toLowerCase()}`; // Apply appropriate style
    }
}

// Check for test results and update status
// function checkTestResults() {
//     setTimeout(() => {
//         fetchTestResults(); // Fetch the latest test results
//         // Call this function again until the tests are completed
//         checkTestResults(); 
//     }, 5000); // Adjust time as necessary
// }

// Fetch all artifacts when viewing details
function fetchAllArtifacts() {
    const artifactsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/artifacts`;

    fetch(artifactsUrl, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((artifactsData) => {
            artifacts = artifactsData.artifacts; // Store artifacts globally
            renderArtifacts(artifactsData.artifacts);
        })
        .catch((error) => {
            alertAndLogError("Error fetching artifacts.", error);
        });
}

// Render artifacts in a structured table with pagination
function renderArtifacts(artifacts) {
    const artifactsContainer = document.getElementById("artifacts-section");
    artifactsContainer.innerHTML = ""; // Clear previous content

    if (artifacts.length === 0) {
        artifactsContainer.innerHTML = "<p>No artifacts found.</p>";
        return;
    }

    // Calculate total pages
    const totalPages = Math.ceil(artifacts.length / artifactsPerPage);

    // Display artifacts for the current page
    displayArtifacts(artifactsContainer, artifacts, currentPage);

    // Add pagination controls
    const paginationControls = document.createElement("div");
    paginationControls.classList.add("pagination-controls");

    const prevButton = document.createElement("button");
    prevButton.innerText = "Previous";
    prevButton.disabled = currentPage === 1; // Disable if on the first page
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            updatePage(artifactsContainer, artifacts, currentPage, totalPages, prevButton, nextButton);
        }
    });

    const nextButton = document.createElement("button");
    nextButton.innerText = "Next";
    nextButton.disabled = currentPage === totalPages; // Disable if on the last page
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            updatePage(artifactsContainer, artifacts, currentPage, totalPages, prevButton, nextButton);
        }
    });

    paginationControls.appendChild(prevButton);
    paginationControls.appendChild(nextButton);
    artifactsContainer.appendChild(paginationControls);

    // Update button states initially
    updatePaginationControls(currentPage, totalPages, prevButton, nextButton);
}

function displayArtifacts(container, artifacts, page) {
    const startIndex = (page - 1) * artifactsPerPage;
    const endIndex = startIndex + artifactsPerPage;
    const artifactsToDisplay = artifacts.slice(startIndex, endIndex);

    const table = document.createElement("table");
    table.classList.add("artifacts-table");

    // Create table header
    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>Name</th>
            <th>Created At</th>
            <th>Actions</th>
        </tr>
    `;
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement("tbody");

    artifactsToDisplay.forEach((artifact) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${artifact.name}</td>
            <td>${new Date(artifact.created_at).toLocaleString()}</td>
            <td>
                <button class="download-btn" data-artifact-id="${artifact.id}">Download</button>
            </td>
        `;
        tbody.appendChild(row);

        // Add event listener to the download button
        const downloadButton = row.querySelector(".download-btn");
        downloadButton.addEventListener("click", () => {
            downloadArtifact(artifact.id); // Reuse the same download function
        });
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

function updatePage(container, artifacts, page, totalPages, prevButton, nextButton) {
    container.innerHTML = ""; // Clear previous content
    displayArtifacts(container, artifacts, page); // Display new artifacts for the current page

    // Add pagination controls again
    const paginationControls = document.createElement("div");
    paginationControls.classList.add("pagination-controls");
    paginationControls.appendChild(prevButton);
    paginationControls.appendChild(nextButton);

    container.appendChild(paginationControls);

    // Update button states
    updatePaginationControls(page, totalPages, prevButton, nextButton);
}

function updatePaginationControls(currentPage, totalPages, prevButton, nextButton) {
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
}



// Update the fetchAllArtifacts function to store the fetched artifacts
function fetchAllArtifacts() {
    const artifactsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/artifacts`;

    fetch(artifactsUrl, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((artifactsData) => {
            artifacts = artifactsData.artifacts; // Store artifacts globally
            renderArtifacts(artifacts);
        })
        .catch((error) => {
            alertAndLogError("Error fetching artifacts.", error);
        });
}

// Download the artifact
function downloadArtifact(artifactId) {
    const downloadUrl = `https://api.github.com/repos/${owner}/${repo}/actions/artifacts/${artifactId}/zip`;

    fetch(downloadUrl, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3.raw",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.blob();
        })
        .then((blob) => extractAndRenderHTML(blob))
        .catch((error) => {
            alertAndLogError("Error downloading artifact.", error);
        });
}

// Extract and render HTML content from the artifact dynamically based on the selected test case
function extractAndRenderHTML(blob) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const zip = new JSZip();
        zip.loadAsync(event.target.result).then(contents => {
            // Construct the expected file name dynamically
            const expectedHtmlFile = `Extent.html`;
            const htmlFile = Object.keys(contents.files).find(file => file.endsWith(expectedHtmlFile));

            if (htmlFile) {
                zip.file(htmlFile).async('text').then(htmlContent => {
                    const newWindow = window.open('', '_blank');
                    if (newWindow) {
                        newWindow.document.open();
                        newWindow.document.write(htmlContent);
                        newWindow.document.close();
                    } else {
                        alert("Popup blocker prevented opening the new tab.");
                    }
                });
            } else {
                alert(`No HTML file found for test case: ${testCaseName}`);
            }
        });
    };
    reader.readAsArrayBuffer(blob);
}

// Populate test results table
function populateReportTable(data) {
    const tableBody = document.querySelector("#test-results-table tbody");
    tableBody.innerHTML = ""; // Clear previous data

    const latestResults = data.slice(-10); // Get the last 10 results
    latestResults.forEach((test) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${test.description}</td>
            <td>${test.status}</td>
            <td>${test.executionTime || "N/A"}</td>
            <td>
                <button class="details-btn action-btn primary-btn" data-artifact-id="${test.artifactId}">View Details</button>
            </td>`;
        tableBody.appendChild(row);
    });

    // Add click event to all view details buttons
    const detailsButtons = document.querySelectorAll(".details-btn");
    detailsButtons.forEach((button) => {
        button.addEventListener("click", () => {
            fetchAllArtifacts(); // Fetch all artifacts when the button is clicked
        });
    });

    if (!latestResults.length) {
        tableBody.innerHTML = `<tr>
            <td colspan="5" style="text-align: center;">No results available.</td>
        </tr>`;
    }
}

// Fetch test results
function fetchTestResults() {
    const testResultsApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/test-results.json`;

    fetch(testResultsApiUrl, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            const decodedContent = atob(data.content);
            const jsonContent = JSON.parse(decodedContent);
            testResults = jsonContent; // Store the results globally
            populateReportTable(testResults);
        })
        .catch((error) => {
            alertAndLogError("Error fetching test results.", error);
        });
}

// Event Handlers
document.addEventListener("DOMContentLoaded", () => {
    loadConfigurations();

    document.getElementById("set-config").addEventListener("click", saveConfig);
    document.getElementById("run-tc1").addEventListener("click", () => {
        //executeTestCase(THREAD_COUNT, "ValidateLogin");
    });

    // Fetch test results on page load
    fetchTestResults();
});
