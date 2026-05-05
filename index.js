const notesContainer = document.querySelector(".notes-container");
const createBtn = document.querySelector(".btn");
const archiveContainer = document.querySelector(".archive-container");
const templateBtn = document.getElementById("templateBtn");
const templateMenu = document.getElementById("templateMenu");
const bgToggle = document.getElementById("bgToggle");
const appContainer = document.querySelector(".container");

document.getElementById("openArchive").addEventListener("click", () => {
    window.location.href = "archive.html";
});

if (localStorage.getItem("bgMode") === "dark") {
    appContainer.classList.add("dark-background");
    bgToggle.textContent = "☀️";
}

// Toggle background only
bgToggle.addEventListener("click", () => {
    appContainer.classList.toggle("dark-background");

    const isDark = appContainer.classList.contains("dark-background");
    bgToggle.textContent = isDark ? "☀️" : "🌙";

    localStorage.setItem("bgMode", isDark ? "dark" : "light");
});


// Toggle menu on button click
templateBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    templateMenu.classList.toggle("show");
    templateMenu.classList.toggle("hidden");
});

// Close menu when clicking outside
document.addEventListener("click", () => {
    templateMenu.classList.add("hidden");
    templateMenu.classList.remove("show");
});

// Prevent closing when clicking inside the menu
templateMenu.addEventListener("click", (e) => {
    e.stopPropagation();
});

templateMenu.addEventListener("click", (e) => e.stopPropagation());

templateMenu.addEventListener("click", (e) => {
    const item = e.target.closest("[data-template]");
    if (!item) return;

    const templateKey = item.dataset.template;
    const templateText = templates[templateKey];

    createTemplateNote(templateText);

    templateMenu.classList.remove("show"); // hide menu after choosing
});



let selectedColor = "#ffffff";
let nextOrder = 1;

const templates = {

    shopping: `🛒 Shopping List`,

    study: `📚 Study Notes`,

    work: `💼 Work Tasks`,

    journal: `📝 Daily Journal`,

    sports: ` 🏃 Sports / Activities`,
};



document.querySelectorAll(".color-option").forEach(option => {
    option.style.backgroundColor = option.dataset.color;

    option.addEventListener("click", () => {
        // remove previous selection
        document.querySelectorAll(".color-option")
            .forEach(o => o.classList.remove("selected"));

        // mark new selection
        option.classList.add("selected");

        // store selected colour
        selectedColor = option.dataset.color;
    });
});

function sortNotes() {
    const notes = Array.from(notesContainer.querySelectorAll(".input-box"));
    notes.sort((a, b) => {
        const aPinned = a.classList.contains("pinned");
        const bPinned = b.classList.contains("pinned");
        if (aPinned !== bPinned) return bPinned - aPinned; // pinned notes first

        // Keep original "line" order using a persistent data-order attribute.
        const aOrder = parseInt(a.dataset.order || "0", 10);
        const bOrder = parseInt(b.dataset.order || "0", 10);
        return aOrder - bOrder;
    });
    notes.forEach(note => notesContainer.appendChild(note));
}

function ensureNoteOrders() {
    const notes = Array.from(notesContainer.querySelectorAll(".input-box"));
    let maxOrder = 0;

    notes.forEach((note, idx) => {
        // Older saved notes may not have a data-order attribute.
        if (!note.dataset.order) note.dataset.order = String(idx);
        const order = parseInt(note.dataset.order || "0", 10);
        if (!Number.isNaN(order)) maxOrder = Math.max(maxOrder, order);
    });

    nextOrder = maxOrder + 1;
}

function createPinButton() {
    const pinBtn = document.createElement("span");
    pinBtn.className = "pin-btn";
    pinBtn.setAttribute("contenteditable", "false");
    pinBtn.setAttribute("aria-label", "Pin note");
    // Emoji is the most universally recognizable "pinned" sign.
    pinBtn.innerHTML = "📌";
    return pinBtn;
}

function createCompleteButton() {
    const completeBtn = document.createElement("span");
    completeBtn.className = "complete-btn";
    completeBtn.setAttribute("contenteditable", "false");
    completeBtn.setAttribute("aria-label", "Mark note as completed");
    completeBtn.innerHTML = "✔️";
    return completeBtn;
}

function createUnderlineButton() {
    const underlineBtn = document.createElement("span");
    underlineBtn.className = "underline-btn";
    underlineBtn.setAttribute("contenteditable", "false");
    underlineBtn.setAttribute("aria-label", "Underline selected text");
    underlineBtn.innerHTML = "🖊️";
    return underlineBtn;
}


function toggleUnderlineSelectedWord() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) return;

    // Check if selection is already inside an underline span
    const parent = selection.anchorNode.parentElement;
    if (parent && parent.classList.contains("underline-word")) {
        // ⭐ Remove underline
        const textNode = document.createTextNode(parent.textContent);
        parent.replaceWith(textNode);
        updateStorage();
        return;
    }

    // ⭐ Add underline
    const span = document.createElement("span");
    span.classList.add("underline-word");
    span.textContent = selectedText;

    range.deleteContents();
    range.insertNode(span);

    updateStorage();
}

function ensurePinButtons() {
    const notes = Array.from(notesContainer.querySelectorAll(".input-box"));
    notes.forEach(note => {
        // Remove old task/checklist icons from previous versions.
        note.querySelectorAll(".checklist-btn, .task-done-btn").forEach(el => el.remove());

        // Ensure delete icon exists (older saved notes might not have it).
        let deleteImg = note.querySelector("img");
        if (!deleteImg) {
            deleteImg = document.createElement("img");
            deleteImg.src = "images/delete.png";
            deleteImg.classList.add("delete-icon");
            deleteImg.setAttribute("contenteditable", "false");
            deleteImg.setAttribute("aria-hidden", "true");
            note.appendChild(deleteImg);
        }

        const existingCompleteBtn = note.querySelector(".complete-btn");
        if (!existingCompleteBtn) {
            note.insertBefore(createCompleteButton(), deleteImg || note.firstChild);
        } else {
            existingCompleteBtn.innerHTML = createCompleteButton().innerHTML;
            existingCompleteBtn.setAttribute("contenteditable", "false");
        }

        const existingPinBtn = note.querySelector(".pin-btn");

        // Backward compatibility: older stored notes won't have the pin element,
        // or it might still contain old text instead of the icon.
        if (!existingPinBtn) {
            note.insertBefore(createPinButton(), deleteImg || note.firstChild);
        } else {
            existingPinBtn.innerHTML = createPinButton().innerHTML;
            existingPinBtn.setAttribute("contenteditable", "false");
        }

        // The delete icon is inside the contenteditable note, so make it non-editable too.
        deleteImg.classList.add("delete-icon");
        deleteImg.setAttribute("contenteditable", "false");
        deleteImg.setAttribute("aria-hidden", "true");
    });
}

function isNoteEmpty(note) {
    const clone = note.cloneNode(true);
    clone.querySelectorAll(".pin-btn, .complete-btn, .underline-btn, img")
        .forEach(el => el.remove());
    return clone.textContent.trim().length === 0;
}

function placeCaretAtStart(note) {
    note.focus();
    const range = document.createRange();
    range.selectNodeContents(note);
    range.collapse(true); // start of the note
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function searchNotes() {
    const query = document.getElementById("searchBar").value.toLowerCase();
    const notes = document.querySelectorAll(".input-box");

    notes.forEach(note => {
        // Clone note to remove icons before searching
        const clone = note.cloneNode(true);
        clone.querySelectorAll(".pin-btn, .complete-btn, img").forEach(el => el.remove());

        const text = clone.innerText.toLowerCase().trim();

        if (query === "" || text.includes(query)) {
            note.style.display = "block";
        } else {
            note.style.display = "none";
        }
    });
}

function showNotes() {
    const storedNotes = localStorage.getItem("notes");

    if (storedNotes) {
        notesContainer.innerHTML = storedNotes;
    }

    ensureNoteOrders();
    ensurePinButtons();
    sortNotes();
    // Persist generated data-order and upgraded controls.
    updateStorage();
}
showNotes();


function updateStorage() {
    localStorage.setItem("notes", notesContainer.innerHTML);

}

createBtn.addEventListener("click", () => {
    let inputBox = document.createElement("p");
    inputBox.className = "input-box";
    inputBox.classList.add("note-fade-in");

    inputBox.style.backgroundColor = selectedColor;
    inputBox.setAttribute("contenteditable", "true");
    inputBox.dataset.order = String(nextOrder++);

    // ⭐ FIX: Add blank text node so caret starts at top
    inputBox.appendChild(document.createTextNode(""));

    // Create delete icon
    let img = document.createElement("img");
    img.src = "images/delete.png";
    img.classList.add("delete-icon");
    img.setAttribute("contenteditable", "false");
    img.setAttribute("aria-hidden", "true");

    // Insert icons AFTER the blank text node
    inputBox.appendChild(img);
    inputBox.insertBefore(createCompleteButton(), img);
    inputBox.insertBefore(createPinButton(), img);
    inputBox.insertBefore(createUnderlineButton(), img);

    notesContainer.appendChild(inputBox);
    placeCaretAtStart(inputBox);   // ⭐ FIX
    updateStorage();
});

notesContainer.addEventListener("click", function (e) {
    const completeBtn = e.target.closest ? e.target.closest(".complete-btn") : null;
    if (completeBtn) {
        const note = completeBtn.closest(".input-box");
        if (!note) return;

        note.classList.toggle("completed");
        updateStorage();
        return;
    }

    const pinBtn = e.target.closest ? e.target.closest(".pin-btn") : null;
    if (pinBtn) {
        const note = pinBtn.closest(".input-box");
        if (!note) return;

        note.classList.toggle("pinned");
        sortNotes();
        updateStorage();
        return;
    }

    const underlineBtn = e.target.closest ? e.target.closest(".underline-btn") : null;
    if (underlineBtn) {
        toggleUnderlineSelectedWord();
        return;
    }

    // If the note is empty and the user clicks the note surface (not icons),
    // move caret to the start so typing starts at the top.
    const clickedNote = e.target.closest(".input-box");

    if (clickedNote && isNoteEmpty(clickedNote)) {
        placeCaretAtStart(clickedNote);
    }

    if (e.target.classList.contains("delete-icon")) {
        const note = e.target.closest(".input-box");

        // 1. Load archive array
        let archive = JSON.parse(localStorage.getItem("archive")) || [];

        // 2. Save the note HTML into archive
        archive.push(note.outerHTML);

        // 3. Save archive back to localStorage
        localStorage.setItem("archive", JSON.stringify(archive));

        // 4. Remove note from main board
        note.remove();

        // 5. Update your existing notes storage
        updateStorage();
        return;
    }

});

let fontSize = parseInt(localStorage.getItem("fontSize")) || 16;

// Apply saved font size on load
document.documentElement.style.fontSize = fontSize + "px";

// Increase font size
document.getElementById("fontIncrease").addEventListener("click", () => {
    fontSize += 2;
    document.documentElement.style.fontSize = fontSize + "px";
    localStorage.setItem("fontSize", fontSize);
});

// Decrease font size
document.getElementById("fontDecrease").addEventListener("click", () => {
    fontSize = Math.max(12, fontSize - 2); // prevent too small
    document.documentElement.style.fontSize = fontSize + "px";
    localStorage.setItem("fontSize", fontSize);
});


function createTemplateNote(text) {
    let inputBox = document.createElement("p");
    inputBox.className = "input-box";
    inputBox.style.backgroundColor = selectedColor;
    inputBox.setAttribute("contenteditable", "true");
    inputBox.dataset.order = String(nextOrder++);

    inputBox.appendChild(document.createTextNode(text));

    // Add icons
    let img = document.createElement("img");
    img.src = "images/delete.png";
    img.classList.add("delete-icon");
    img.setAttribute("contenteditable", "false");

    inputBox.appendChild(img);
    inputBox.insertBefore(createCompleteButton(), img);
    inputBox.insertBefore(createPinButton(), img);
    inputBox.insertBefore(createUnderlineButton(), img);

    notesContainer.appendChild(inputBox);
    updateStorage();
}

// Persist note edits when the user types.
notesContainer.addEventListener("input", updateStorage);

document.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        document.execCommand("insertLineBreak");
        event.preventDefault();
    }

});

document.getElementById("searchBar").addEventListener("input", searchNotes);

async function loadNotes() {
    const res = await fetch("/api/notes");
    const notes = await res.json();

    const container = document.getElementById("notes");
    container.innerHTML = "";

    notes.forEach(n => {
        const div = document.createElement("div");
        div.className = "note";
        div.textContent = n.text;
        container.appendChild(div);
    });
}

document.getElementById("addBtn").onclick = async () => {
    const text = document.getElementById("noteInput").value;
    if (!text.trim()) return;

    await fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    });

    document.getElementById("noteInput").value = "";
    loadNotes();
};

window.addEventListener("storage", function (event) {
    if (event.key === "restoreSignal") {
        showNotes();   // ✅ reload from localStorage
    }
});


loadNotes();

