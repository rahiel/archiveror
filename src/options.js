import { hasPageCapture } from "./utils.js";


function save_options() {

    function get_options(name) {
        // get the selected options by name
        let checkboxes = document.getElementsByName(name);
        let options = [];
        for (let c of checkboxes) {
            if (c.checked === true) {
                options.push(c.value);
            }
        }
        return options;
    }

    let mode = get_options("mode")[0];
    let services = get_options("service");

    let dir = document.getElementById("dir").value;
    // TODO: check dir for forbidden characters
    let email = document.getElementById("email").value;
    let bookmarks = document.getElementById("bookmarks").checked;

    chrome.storage.local.set({
        archiveBookmarks: bookmarks,
        archiveDir: dir,
        archiveMode: mode,
        archiveServices: services,
        email: email,
    });
}

function restore_options() {
    chrome.storage.local.get({  // below are the default values
        archiveBookmarks: true,
        archiveDir: "Archiveror",
        archiveMode: "online",
        archiveServices: ["archive.is"],
        email: "",
    }, set_options);

    function set_options(items) {
        if (items.archiveBookmarks === true) {
            document.getElementById("bookmarks").checked = true;
        }

        document.getElementById("dir").value = items.archiveDir;
        document.getElementById("email").value = items.email;
        for (let s of items.archiveServices) {
            document.getElementById(s).checked = true;
        }

        if (items.archiveMode === "online") {
            document.getElementById("online").checked = true;
        } else {
            document.getElementById("local").checked = true;
            document.getElementById("local_options").style.display = "block";
        }
    }
}
document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("local").addEventListener("click", show_local);
document.getElementById("online").addEventListener("click", show_local);

let inputs = document.querySelectorAll(`input[type="checkbox"], input[type="radio"]`);
for (let input of inputs) {
    input.addEventListener("change", save_options);
}
let textInputs = document.querySelectorAll(`input[type="text"]`);
for (let input of textInputs) {
    input.addEventListener("input", save_options);
}

function show_local() {
    let local = document.getElementById("local").checked;
    if (local === true) {
        document.getElementById("local_options").style.display = "block";
    } else {
        document.getElementById("local_options").style.display = "none";
    }
}

if (!hasPageCapture) {
    let div = document.getElementById("archivingMode");
    div.style.display = "none";
}
