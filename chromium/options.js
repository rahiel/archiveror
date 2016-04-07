function save_options() {

    function get_radio_option(name) {
        // get the selected radio option by name
        let radio = document.getElementsByName(name);
        let option = "None";
        for (let i = 0; i < radio.length; i++) {
            if (radio[i].checked === true) {
                option = radio[i].value;
                break;
            }
        }
        if (option === "None")
            message("Please select a mode.");  // this should never happen
        return option;
    }
    let mode = get_radio_option("mode");
    let service = get_radio_option("service");

    let dir = document.getElementById("dir").value;
    // TODO: check dir for forbidden characters
    let bookmarks = document.getElementById("bookmarks").checked;

    chrome.storage.local.set({
        archiveMode: mode, archiveDir: dir, archiveBookmarks: bookmarks, archiveService: service
    }, function () {
        message("Options saved.");
    });
}

function restore_options() {
    chrome.storage.local.get({  // below are the default values
        archiveMode: "online", archiveDir: "Archiveror", archiveBookmarks: true, archiveService: "archive.is"
    }, set_options);

    function set_options(items) {
        if (items.archiveBookmarks === true) {
            document.getElementById("bookmarks").checked = true;
        }

        document.getElementById("dir").value = items.archiveDir;

        if (items.archiveService === "archive.is")
            document.getElementById("archive.is").checked = true;
        else if (items.archiveService === "archive.org")
            document.getElementById("archive.org").checked = true;

        if (items.archiveMode === "online")
            document.getElementById("online").checked = true;
        else {
            document.getElementById("local").checked = true;
            document.getElementById("local_options").style.display = "block";
        }
    }
}
document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click", save_options);
document.getElementById("local").addEventListener("click", show_local);
document.getElementById("online").addEventListener("click", show_local);

function show_local() {
    let local = document.getElementById("local").checked;
    if (local === true)
        document.getElementById("local_options").style.display = "block";
    else
        document.getElementById("local_options").style.display = "none";
}

function message(text) {
    let status = document.getElementById("status");
    status.textContent = text;
    window.setTimeout(function () {
        status.textContent = "";
    }, 3000);
}
