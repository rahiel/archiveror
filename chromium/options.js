function save_options() {
    var radio = document.getElementsByName("mode");
    var mode = "None";
    for (var i = 0; i < radio.length; i++) {
        if (radio[i].checked === true)
            mode = radio[i].value;
    }
    if (mode === "None")
        message("Please select a mode.");  // this should never happen

    var dir = document.getElementById("dir").value;
    // TODO: check dir for forbidden characters
    var bookmarks = document.getElementById("bookmarks").checked;

    chrome.storage.local.set({
        archiveMode: mode, archiveDir: dir, archiveBookmarks: bookmarks
    }, function() {
        message("Options saved.");
    });
}

function restore_options() {
    chrome.storage.local.get({
        archiveMode: "online", archiveDir: "Archiveror", archiveBookmarks: true
    }, set_options);

    function set_options (items) {
        if (items.archiveBookmarks === true) {
            document.getElementById("bookmarks").checked = true;
        }

        document.getElementById("dir").value = items.archiveDir;
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

function show_local () {
    var local = document.getElementById("local").checked;
    if (local === true)
        document.getElementById("local_options").style.display = "block";
    else
        document.getElementById("local_options").style.display = "none";
}

function message (text) {
    var status = document.getElementById("status");
    status.textContent = text;
    setTimeout(function() {
        status.textContent = "";
    }, 3000);
}
