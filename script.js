"use strict";

/*
 * Temporary local data.
 *
 * Later, this array will be replaced by data loaded from
 * Google Apps Script and Google Sheets.
 */
const API_URL =
    "https://script.google.com/macros/s/AKfycbwLxYbOxfUbDRDJUfGl_TV5IyW9qQAvJNEdxdJNs9aPJptT2yIGynsC8w41u0Xfuk_ywA/exec";

let engolpia = [];

const grid = document.getElementById("engolpiaGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const resultsText = document.getElementById("resultsText");
const emptyState = document.getElementById("emptyState");
const copyNumberInput = document.getElementById("copyNumber");

const borrowDialog = document.getElementById("borrowDialog");
const borrowForm = document.getElementById("borrowForm");
const closeDialogButton = document.getElementById("closeDialogButton");

const dialogTitle = document.getElementById("dialogTitle");
const selectedEngolpioId = document.getElementById("selectedEngolpioId");
const borrowerName = document.getElementById("borrowerName");
const formMessage = document.getElementById("formMessage");
const toast = document.getElementById("toast");

const returnDialog =
    document.getElementById("returnDialog");

const returnForm =
    document.getElementById("returnForm");

const returnEngolpioId =
    document.getElementById("returnEngolpioId");

const returnCopyNumber =
    document.getElementById("returnCopyNumber");

const returnDialogTitle =
    document.getElementById("returnDialogTitle");

const returnFormMessage =
    document.getElementById("returnFormMessage");

const closeReturnDialogButton =
    document.getElementById(
        "closeReturnDialogButton"
    );

/**
 * Escapes user-controlled text before placing it into HTML.
 */
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function loadEngolpia() {
    console.log("Starting loadEngolpia...");
    console.log("API URL:", API_URL);

    resultsText.textContent = "Loading engolpia...";
    grid.innerHTML = "";

    try {
        const response = await fetch(API_URL);

        console.log("Response received:", response);
        console.log("Status:", response.status);

        const text = await response.text();

        console.log("Raw response:", text);

        if (!response.ok) {
            throw new Error(
                `Server returned status ${response.status}`
            );
        }

        const data = JSON.parse(text);

        console.log("Parsed data:", data);

        if (!Array.isArray(data)) {
            throw new Error(
                "The server response is not an array."
            );
        }

        engolpia = data
            .filter((item) => item.id !== "")
            .map((item) => ({
                id: Number(item.id),
                title: String(item.title || ""),
                category: String(item.category || "Other"),
                available: normalizeBoolean(item.available),
                totalCopies: Number(item.totalCopies || 0),
                availableCopies: Array.isArray(item.availableCopies)
                    ? item.availableCopies.map(Number)
                    : []
            }));

        console.log("Normalized engolpia:", engolpia);

        populateCategories();
        renderEngolpia();
    } catch (error) {
        console.error("Load error:", error);

        resultsText.textContent =
            "The engolpia could not be loaded.";

        grid.innerHTML = `
            <div class="load-error">
                <h2>Loading failed</h2>
                <p>${escapeHtml(error.message)}</p>

                <button
                    type="button"
                    class="primary-button retry-button"
                    id="retryButton"
                >
                    Try again
                </button>
            </div>
        `;

        document
            .getElementById("retryButton")
            ?.addEventListener("click", loadEngolpia);
    }
}
function normalizeBoolean(value) {
    if (typeof value === "boolean") {
        return value;
    }

    return String(value).toLowerCase() === "true";
}


/**
 * Creates the category options from the available data.
 */
function populateCategories() {
    categoryFilter.innerHTML = `
        <option value="all">All categories</option>
    `;

    const categories = [
        ...new Set(
            engolpia
                .map((item) => item.category)
                .filter(Boolean)
        )
    ].sort();

    for (const category of categories) {
        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryFilter.appendChild(option);
    }
}
/**
 * Returns the engolpia matching the current search and category.
 */
function getFilteredEngolpia() {
    const searchTerm = searchInput.value
        .trim()
        .toLowerCase();

    const selectedCategory = categoryFilter.value;

    return engolpia.filter((item) => {
        const matchesSearch =
            item.title.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm) ||
            String(item.id).includes(searchTerm);

        const matchesCategory =
            selectedCategory === "all" ||
            item.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });
}

/**
 * Displays all matching engolpia.
 */
function renderEngolpia() {
    const filteredEngolpia = getFilteredEngolpia();

    grid.innerHTML = "";

    resultsText.textContent =
        `${filteredEngolpia.length} engolpia found`;

    emptyState.classList.toggle(
        "hidden",
        filteredEngolpia.length !== 0
    );

    for (const item of filteredEngolpia) {
        const card = document.createElement("article");
        card.className = "engolpio-card";

        const statusText = item.available
            ? "Available"
            : "Already borrowed";

        const statusClass = item.available
            ? "status-available"
            : "status-borrowed";

        card.innerHTML = `
            <div class="engolpio-cover" aria-hidden="true">
                📖
            </div>

            <div class="engolpio-content">
                <p class="engolpio-number">
                    Engolpio #${escapeHtml(item.id)}
                </p>

                <h2 class="engolpio-title">
                    ${escapeHtml(item.title)}
                </h2>

                <p class="engolpio-category">
                    ${escapeHtml(item.category)}
                </p>

                <span class="status-badge ${statusClass}">
                    ${statusText}
                </span>

                <p>
                    Διαθέσιμα:
                    ${item.availableCopies.length}
                    από ${item.totalCopies}
                </p>

                <p>
                    Διαθέσιμοι αριθμοί:
                    ${item.availableCopies.join(", ") || "Κανένας"}
                </p>

                <button
                    type="button"
                    class="borrow-button"
                    data-id="${escapeHtml(item.id)}"
                    ${item.available ? "" : "disabled"}
                >
                    ${item.available ? "Borrow this engolpio" : "Unavailable"}
                </button>

                <button
                    type="button"
                    class="secondary-button return-button"
                    data-id="${item.id}"
                >
                    Επιστροφή
                </button>
            </div>
        `;

        grid.appendChild(card);
    }

    document
        .querySelectorAll(".return-button")
        .forEach(button => {
            button.addEventListener("click", () => {
                openReturnDialog(
                    Number(button.dataset.id)
                );
            });
        });
}

/**
 * Opens the borrowing form for one engolpio.
 */
function openBorrowDialog(id) {
    const selectedItem = engolpia.find(
        (item) => item.id === id
    );

    if (!selectedItem || !selectedItem.available) {
        showToast("This engolpio is not currently available.");
        renderEngolpia();
        return;
    }

    selectedEngolpioId.value = String(selectedItem.id);
    dialogTitle.textContent = selectedItem.title;

    borrowerName.value = "";
    formMessage.textContent = "";


    borrowDialog.showModal();
    borrowerName.focus();
}

function openReturnDialog(id) {
    const item = engolpia.find(
        engolpio => engolpio.id === id
    );

    if (!item) {
        return;
    }

    returnEngolpioId.value = item.id;
    returnDialogTitle.textContent = item.title;
    returnCopyNumber.value = "";
    returnCopyNumber.max = item.totalCopies;
    returnFormMessage.textContent = "";

    returnDialog.showModal();
}


/**
 * Temporarily performs a local borrowing.
 *
 * Later, this function will send the borrowing request
 * to Google Apps Script.
 */
async function submitBorrowing(event) {
    event.preventDefault();

    formMessage.textContent = "";

    const id = Number(selectedEngolpioId.value);
    const name = borrowerName.value.trim();
    const copyNumber =Number(copyNumberInput.value);

    if (!name) {
        formMessage.textContent =
            "Please enter your full name.";
        return;
    }

    if (!Number.isInteger(copyNumber) || copyNumber < 1) {
        formMessage.textContent =
            "Γράψε έναν έγκυρο αριθμό εγκολπίου.";
        return;
    }

    const submitButton = borrowForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    try {
        const formData = new URLSearchParams();

        formData.append("engolpioId", id);
        formData.append("copyNumber", copyNumber);
        formData.append("borrower", name);

        const response = await fetch(
            `${API_URL}?action=borrow`,
            {
                method: "POST",
                body: formData
            }
        );

        const text = await response.text();

        console.log("Borrow response:", text);

        const result = JSON.parse(text);

        if (!result.success) {
            throw new Error(
                result.error || "Borrowing failed."
            );
        }

        borrowDialog.close();

        showToast(
            "The engolpio was borrowed successfully."
        );

        await loadEngolpia();
    } catch (error) {
        console.error("Borrow error:", error);

        formMessage.textContent =
            error.message ||
            "The borrowing could not be saved.";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent =
            "Confirm borrowing";
    }
}

async function submitReturn(event) {
    event.preventDefault();

    returnFormMessage.textContent = "";

    const id = Number(returnEngolpioId.value);
    const copyNumber =
        Number(returnCopyNumber.value);

    if (!Number.isInteger(copyNumber)) {
        returnFormMessage.textContent =
            "Γράψε έγκυρο αριθμό εγκολπίου.";
        return;
    }

    const submitButton = returnForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;
    submitButton.textContent = "Αποθήκευση...";

    try {
        const formData = new URLSearchParams();

        formData.append("engolpioId", id);
        formData.append(
            "copyNumber",
            copyNumber
        );

        const response = await fetch(
            `${API_URL}?action=return`,
            {
                method: "POST",
                body: formData
            }
        );

        const result = await response.json();

        if (!result.success) {
            throw new Error(
                result.error ||
                "Η επιστροφή απέτυχε."
            );
        }

        returnDialog.close();

        showToast(
            `Το εγκόλπιο ${copyNumber} επιστράφηκε.`
        );

        await loadEngolpia();
    } catch (error) {
        returnFormMessage.textContent =
            error.message;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent =
            "Επιβεβαίωση επιστροφής";
    }
}

/**
 * Displays a temporary notification.
 */
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");

    window.clearTimeout(showToast.timeoutId);

    showToast.timeoutId = window.setTimeout(() => {
        toast.classList.remove("visible");
    }, 3200);
}

searchInput.addEventListener("input", renderEngolpia);
categoryFilter.addEventListener("change", renderEngolpia);

grid.addEventListener("click", (event) => {
    const button = event.target.closest(".borrow-button");

    if (!button || button.disabled) {
        return;
    }

    const id = Number(button.dataset.id);

    openBorrowDialog(id);
});

closeDialogButton.addEventListener("click", () => {
    borrowDialog.close();
});

borrowDialog.addEventListener("click", (event) => {
    if (event.target === borrowDialog) {
        borrowDialog.close();
    }
});

borrowForm.addEventListener("submit", submitBorrowing);

returnForm.addEventListener(
    "submit",
    submitReturn
);

closeReturnDialogButton.addEventListener(
    "click",
    () => returnDialog.close()
);

loadEngolpia();