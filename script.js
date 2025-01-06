// GitHub API Configuration
const owner = "gouravAretedge"; // Replace with your GitHub repo owner
const repo = "AretedgeAutomationDemo"; // Replace with your GitHub repo name
let GITHUB_TOKEN = localStorage.getItem("githubToken");
let THREAD_COUNT = localStorage.getItem("threads_count");

// Global variable to manage pagination and artifacts

let currentPage = 1;

const artifactsPerPage = 10;

let artifacts = []; // Store fetched artifacts here



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
function executeTestCase(param, className) {
    if (!GITHUB_TOKEN) {
        alert("GitHub token not set. Please configure it first.");
        return;
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
            } else {
                return response.json().then((err) => {
                    alertAndLogError("Error triggering workflow.", err);
                });
            }
        })
        .catch((err) => {
            alertAndLogError("Network error: Failed to connect to GitHub API.", err);
        });
}

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

            currentPage = 1; // Reset to first page
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

    // Display initial artifacts for the first page
    displayArtifacts(artifacts, currentPage);

    // Create pagination controls
    const paginationControls = document.createElement("div");
    paginationControls.classList.add("pagination-controls");

    // Previous Button
    const prevButton = document.createElement("button");
    prevButton.innerText = "Previous";
    prevButton.disabled = currentPage === 1; // Disable if on the first page
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            displayArtifacts(artifacts, currentPage); // Update artifacts for the previous page
            updatePaginationControls(totalPages);
        }
    });
    paginationControls.appendChild(prevButton);

    // Next Button
    const nextButton = document.createElement("button");
    nextButton.innerText = "Next";
    nextButton.disabled = currentPage === totalPages; // Disable if on the last page
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayArtifacts(artifacts, currentPage); // Update artifacts for the next page
            updatePaginationControls(totalPages);
        }
    });
    paginationControls.appendChild(nextButton);

    artifactsContainer.appendChild(paginationControls);
}

// Function to display artifacts for the current page
function displayArtifacts(artifacts, page) {
    const artifactsContainer = document.getElementById("artifacts-section");

    // Clear previous content but keep pagination controls
    const paginationControls = artifactsContainer.querySelector(".pagination-controls");
    artifactsContainer.innerHTML = paginationControls ? paginationControls.outerHTML : "";

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
    artifactsContainer.insertBefore(table, artifactsContainer.firstChild);
}

// Function to update the state of pagination controls
function updatePaginationControls(totalPages) {
    const prevButton = document.querySelector(".pagination-controls button:first-child");
    const nextButton = document.querySelector(".pagination-controls button:last-child");

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


// Extract and render HTML content from the artifact
function extractAndRenderHTML(blob) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const zip = new JSZip();
        zip.loadAsync(event.target.result).then(contents => {
            const htmlFile = Object.keys(contents.files).find(file => file.endsWith('Extent.html'));
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
                alert("No HTML file found in artifact.");
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
            <td>${test.testCaseId}</td>
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
            populateReportTable(jsonContent);
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
        executeTestCase(THREAD_COUNT, "ValidateLogin");
    });

    // Fetch test results on page load
    fetchTestResults();
});


