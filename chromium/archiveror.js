function archive_is(url, save) {
    var request = new XMLHttpRequest();
    request.open("POST", "https://archive.is/submit/", true);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    var params = "url=" + encodeURIComponent(url);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            var link = request.response.match(/(https?:\/\/archive.is\/\w+)/)[0];
            postArchive(url, link, save);
        }
    };
    request.send(params);
}

function postArchive(url, link, save) {
    if (save === true) {
        var key = {};
        key[url] = link;
        chrome.storage.local.set(key, function () {
            showArchive(url);
        });
    }
    else {
        // Preference option?
        chrome.tabs.create({"url": link});
    }
}

function showArchive(url) {
    chrome.storage.local.get(url, function (key) {
        if (key[url]) {
            chrome.tabs.query({"url": url}, function (tabs) {
                for (var i = 0; i < tabs.length; i++) {
                    // Following changes reset automatically when the tab changes
                    chrome.browserAction.setTitle({title: buttonTitle.present, tabId: tabs[i].id});
                    chrome.browserAction.setBadgeText({text: "!", tabId: tabs[i].id});
                    chrome.browserAction.setBadgeBackgroundColor({color: "#FFB90F", tabId: tabs[i].id});
                }
            });
        }
        else {
            archive(url, true);
        }
    });
}

function newBookmark(id, bookmark) {
    if (bookmark.hasOwnProperty("url")) {
        archive(bookmark.url, true);
    }
}

var buttonTitle = {default: "Archive Page", present: "Go to archived page"};
// When user clicks on button
function archiveClick (tab) {
    chrome.browserAction.getTitle({tabId: tab.id}, function (text) {
        if (text === buttonTitle.present) {
            chrome.storage.local.get(tab.url, function (key) {
                chrome.tabs.create({"url": key[tab.url]});
            });
        }
        else
            archive(tab.url, false, tab);
    });
}
chrome.browserAction.onClicked.addListener(archiveClick);

function archive (url, save, tab) {
    chrome.storage.sync.get({archiveMode: "online"}, userAction);

    function userAction (items) {
        if (items.archiveMode === "online")
            archive_is(url, save);
        else {
            if (typeof tab === "undefined") {
                chrome.tabs.query({url: url}, function (tabs) {
                    saveLocal(tabs[0], save);
                });
            }
            else
                saveLocal(tab, save);
        }
    }
}

function saveLocal(tab, automatic) {
    // ask user for input if automatic is false
    // TODO: save archive file path
    // TODO: use the archive subdirectory
    chrome.pageCapture.saveAsMHTML({tabId: tab.id}, blobToDisk);

    function blobToDisk (mhtmlData) {
        var filename = makeFilename(tab.title);
        var url = URL.createObjectURL(mhtmlData);
        if (automatic === true)
            chrome.downloads.download({url: url, filename: filename}, clearFile);
        else {
            chrome.downloads.download({url: url, filename: filename,
                                       saveAs: true}, clearFile);
        }
    }

    // Called after download starts
    function clearFile (downloadId) {
        chrome.downloads.search({id: downloadId}, function (DownloadItems) {
            if (DownloadItems[0].state === "complete") {
                chrome.downloads.erase({id: downloadId});
            }
            else {
                // wait for 3s, and try to erase it then
                window.setTimeout(clearFile, 3000, downloadId);
            }
        });
    }

    function makeFilename (title) {
        // Windows disallows <>:"/\|?* in filenames, remove them
        var name = title;
        var re = /[<>:"/\\|?]/g;
        name = title.replace(re, "").trim();
        return name + ".mhtml";
    }
}

// Keyboard shortcut
chrome.commands.onCommand.addListener(function (command) {
    if (command === "archive-page") {
        chrome.tabs.query({active: true}, function (tabs) {
            archive_is(tabs[0].url, false);
        });
    }
});

// At new Bookmark
chrome.bookmarks.onCreated.addListener(newBookmark);

// On page visit (check if it's a bookmark)
function bookmarkVisit (tabId, changeInfo, tab) {
    if (changeInfo.status === "complete") {
        chrome.bookmarks.search({url: tab.url}, function (bookmarks) {
            if (bookmarks.length > 0 && bookmarks[0].url === tab.url) {
                showArchive(bookmarks[0].url);
            }
        });
    }
}
chrome.tabs.onUpdated.addListener(bookmarkVisit);
