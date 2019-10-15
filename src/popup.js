import { hasPageCapture } from "./utils.js";


function requestOnline(services) {

    function requestArchive() {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
            let url = tabs[0].url;
            chrome.runtime.sendMessage({
                label: "archiveOnline",
                services: services,
                url: url,
            });
            closePopup();
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
        closePopup();
    });
}

function requestArchiveNow() {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
        let tab = tabs[0];
        chrome.runtime.sendMessage({
            label: "archiveNow",
            tabId: tab.id,
            url: tab.url,
        });
        closePopup();
    });
}

document.getElementById("now").onclick = requestArchiveNow;

document.getElementById("archive.is").onclick = requestOnline(["archive.is"]);
document.getElementById("archive.org").onclick = requestOnline(["archive.org"]);
document.getElementById("perma.cc").onclick = requestOnline(["perma.cc"]);
document.getElementById("webcitation.org").onclick = requestOnline(["webcitation.org"]);

document.getElementById("mhtml").onclick = requestMHTML;

function showElements() {
    // show elements when they're useful
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
        let url = tabs[0].url;
        chrome.storage.local.get(url, function (items) {
            let showBookmarkSection = false;
            if (items[url]) {
                for (let k of Object.keys(items[url])) {
                    if (k === "mhtml") addArchiveLink("file://" + items[url].mhtml.filename);
                    else addArchiveLink(items[url][k]);
                }
            }

            if (showBookmarkSection === true) {
                document.getElementById("bookmarkSection").style.display = "block";
            }

            function addArchiveLink(url) {
                let displayLink = url;
                if (displayLink.startsWith("https://")) {
                    displayLink = displayLink.slice(8);
                }
                if (displayLink.length > 36) {
                    displayLink = displayLink.slice(0, 36) + "...";
                }

                let e = document.createElement("li");
                e.innerHTML = `<a>${displayLink}</a>`;
                e.onclick = openURL(url);
                document.getElementById("archiveList").appendChild(e);
                showBookmarkSection = true;
            }

            if (hasPageCapture) {
                document.getElementById("local").style.display = "block";
            }
        });
    });
}
showElements();

function closePopup() {
    // Popups are not automatically closed after opening new tabs in Firefox.
    window.close();
}

function openURL(url) {
    function f() {
        chrome.tabs.create({url: url});
        closePopup();
    }
    return f;
}

function showVersion() {
    const manifest = chrome.runtime.getManifest();
    const version = manifest.version;
    const url = manifest.homepage_url;
    document.getElementById("version").textContent = version;
    document.getElementsByTagName("footer")[0].onclick = openURL(url);
}
showVersion();
