// Get archive container
const archiveContainer = document.getElementById("archiveContainer");
const restoreBtn = document.createElement("button");

// -------------------------
// LOAD ARCHIVE NOTES
// -------------------------
function loadArchive() {
    let archive = JSON.parse(localStorage.getItem("archive")) || [];

    archiveContainer.innerHTML = "";

    archive.forEach((noteHTML, index) => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("archive-note");

        // Insert saved HTML
        wrapper.innerHTML = noteHTML;

        // Find the note
        const note = wrapper.querySelector(".input-box");
        if (!note) return;

        // Make note read-only
        note.setAttribute("contenteditable", "false");

        // Remove icons
        note.querySelectorAll(
            ".pin-btn, .delete-icon, .complete-btn, .underline-btn, .checklist-btn"
        ).forEach(icon => icon.remove());

        // Clear wrapper and re‑append cleaned note
        wrapper.innerHTML = "";
        wrapper.appendChild(note);

        // Add Restore button
        const restoreBtn = document.createElement("button");
        restoreBtn.textContent = "↩ Restore";
        restoreBtn.className = "restore-btn";
        restoreBtn.dataset.index = index;

        wrapper.appendChild(restoreBtn);

        // Add to archive container
        archiveContainer.appendChild(wrapper);
    });
}



function searchArchive() {
    const query = document.getElementById("searchBar").value.toLowerCase();
    const notes = archiveContainer.querySelectorAll(".archive-note");

    notes.forEach(note => {
        const text = note.innerText.toLowerCase();

        if (text.includes(query)) {
            note.style.display = "block";
        } else {
            note.style.display = "none";
        }
    });
}

// -------------------------
// DELETE ALL POPUP
// -------------------------
document.getElementById("deleteAllBtn").addEventListener("click", () => {
    document.getElementById("deletePopup").classList.remove("hidden");
});

document.getElementById("cancelDelete").addEventListener("click", () => {
    document.getElementById("deletePopup").classList.add("hidden");
});

document.getElementById("confirmDelete").addEventListener("click", () => {
    localStorage.setItem("archive", JSON.stringify([]));
    loadArchive();
    document.getElementById("deletePopup").classList.add("hidden");
});

document.getElementById("searchBar").addEventListener("input", searchArchive);




// -------------------------
// RESTORE A SINGLE NOTE
// -------------------------
archiveContainer.addEventListener("click", function (e) {
    if (!e.target.classList.contains("restore-btn")) return;

    const index = Number(e.target.dataset.index);

    let archive = JSON.parse(localStorage.getItem("archive")) || [];
    // Main board stores notes as raw HTML string.
    let notesHTML = localStorage.getItem("notes") || "";

    // Get HTML from archive
    const restoredNote = archive[index];
    if (!restoredNote) return;

    // Add restored note back to the TOP of main notes HTML.
    notesHTML = restoredNote + notesHTML;
    localStorage.setItem("notes", notesHTML);

    // Remove from archive
    archive.splice(index, 1);
    localStorage.setItem("archive", JSON.stringify(archive));

    // Notify index.html to update instantly (no refresh needed)
    localStorage.setItem("restoreSignal", Date.now());

    // Refresh archive page
    loadArchive();
});


// -------------------------
// INITIAL LOAD
// -------------------------
loadArchive();
