import { defaults, hasPageCapture } from "./utils.js";


function saveOptions() {

    function getOptions(name) {
        let checkboxes = document.getElementsByName(name);  // get the selected options by name
        let options = [];
        for (let c of checkboxes) {
            if (c.checked === true) {
                options.push(c.value);
            }
        }
        return options;
    }

    let services = getOptions("service");
    let bookmarkServices = getOptions("bookmarkService");

    let dir = document.getElementById("dir").value;  // TODO: check dir for forbidden characters
    let email = document.getElementById("email").value;
    let bookmarks = document.getElementById("bookmarks").checked;

    chrome.storage.local.set({
        archiveBookmarks: bookmarks,
        archiveDir: dir,
        archiveServices: services,
        bookmarkServices: bookmarkServices,
        email: email,
    });
}

function restoreOptions() {
    chrome.storage.local.get({
        archiveBookmarks: defaults.archiveBookmarks,
        archiveDir: defaults.archiveDir,
        archiveServices: defaults.archiveServices,
        bookmarkServices: defaults.bookmarkServices,
        email: defaults.email,
    }, setOptions);

    function setOptions(items) {
        if (items.archiveBookmarks === true) {
            document.getElementById("bookmarks").checked = true;
        }

        document.getElementById("dir").value = items.archiveDir;
        document.getElementById("email").value = items.email;
        for (let s of items.archiveServices) {
            document.getElementById(s).checked = true;
        }
        for (let s of items.bookmarkServices) {
            document.getElementById("bookmark-" + s).checked = true;
        }

        showLocal();
    }
}
document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("bookmark-mhtml").addEventListener("click", showLocal);

let inputs = document.querySelectorAll(`input[type="checkbox"], input[type="radio"]`);
for (let input of inputs) {
    input.addEventListener("change", saveOptions);
}
let textInputs = document.querySelectorAll(`input[type="text"]`);
for (let input of textInputs) {
    input.addEventListener("input", saveOptions);
}

function showLocal() {
    // show/hide options for local archiving
    if (!hasPageCapture) {
        let options = document.getElementsByClassName("mhtml");
        for (let opt of options) {
            opt.style.display = "none";
        }
    }

    let local = document.getElementById("bookmark-mhtml").checked;
    if (local === true) {
        document.getElementById("local_options").style.display = "block";
    } else {
        document.getElementById("local_options").style.display = "none";
    }
    // TODO: show/hide bookmark_options
}
