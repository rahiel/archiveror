function click(services) {

    function requestArchive() {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
            let url = tabs[0].url;
            chrome.runtime.sendMessage({
                label: "archiveOnline",
                services: services,
                url: url,
            });
        });
    }

    return requestArchive;
}

function requestMHTML() {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
        let tab = tabs[0];
        chrome.runtime.sendMessage({
            label: "saveLocal",
            tabId: tab.id,
        });
    });
}

document.getElementById("archive.is").onclick = click(["archive.is"]);
document.getElementById("archive.org").onclick = click(["archive.org"]);
document.getElementById("perma.cc").onclick = click(["perma.cc"]);
document.getElementById("webcitation.org").onclick = click(["webcitation.org"]);

document.getElementById("mhtml").onclick = requestMHTML;

function showBookmarkArchives() {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
        let url = tabs[0].url;
        chrome.storage.local.get([url, "_" + url], function (items) {
            let showBookmarkSection = false;
            if (items[url]) {
                addArchiveLink(items[url]);
            }
            if (items["_" + url]) {
                addArchiveLink("file://" + items["_" + url].filename);
            }

            if (showBookmarkSection === true) {
                document.getElementById("bookmarkSection").style.display = "block";
            }

            function addArchiveLink(url) {
                let e = document.createElement("li");
                e.innerHTML = `<a href="${url}">${url}</a>`;
                e.onclick = function () { chrome.tabs.create({url: url}); };
                document.getElementById("archiveList").appendChild(e);
                showBookmarkSection = true;
            }
        });
    });
}
showBookmarkArchives();
