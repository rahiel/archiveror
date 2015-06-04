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
        var data = {};
        data[url] = link;
        chrome.storage.local.set(data, function () {
            showArchive(url);
        });
    }
    else {
        // Preference option?
        chrome.tabs.create({"url": link});
    }
}

function showArchive(url, bookmark) {
    chrome.storage.sync.get({archiveMode: "online"}, function (items) {
        if (items.archiveMode === "local")
            showBadge('_' + url);
        else
            showBadge(url);
    });

    function showBadge (url) {
        chrome.storage.local.get(url, function (data) {
            if (data[url]) {
                var taburl = normalURL(url).split('#')[0];
                chrome.tabs.query({"url": taburl}, function (tabs) {
                    for (var i = 0; i < tabs.length; i++) {
                        // Following changes reset automatically when the tab changes
                        chrome.browserAction.setTitle({title: buttonTitle.present, tabId: tabs[i].id});
                        chrome.browserAction.setBadgeText({text: "!", tabId: tabs[i].id});
                        chrome.browserAction.setBadgeBackgroundColor({color: "#FFB90F", tabId: tabs[i].id});
                    }
                });
            }
            else {
                archive(normalURL(url), true, undefined, bookmark);
            }
        });
    }

    function normalURL (url) {
        if (url[0] === '_')
            return url.slice(1);
        else
            return url;
    }
}

var buttonTitle = {default: "Archive Page", present: "Go to archived page"};
function archiveClick (tab) {
    // When user clicks on button
    chrome.browserAction.getTitle({tabId: tab.id}, function (text) {
        if (text === buttonTitle.present) {
            chrome.storage.sync.get({archiveMode: "online"}, function (items) {
                if (items.archiveMode === "local") {
                    chrome.storage.local.get('_' + tab.url, function (data) {
                        var url = data['_' + tab.url]["filename"];
                        chrome.tabs.create({"url": "file://" + url});
                    });
                }
                else {
                    chrome.storage.local.get(tab.url, function (key) {
                        chrome.tabs.create({"url": key[tab.url]});
                    });
                }
            });
        }
        else
            archive(tab.url, false, tab);
    });
}
chrome.browserAction.onClicked.addListener(archiveClick);

function archive (url, save, tab, bookmark) {
    // tab and bookmark are optional
    chrome.storage.sync.get({archiveMode: "online"}, userAction);

    function userAction (items) {
        if (items.archiveMode === "online")
            archive_is(url, save);
        else {
            if (typeof tab === "undefined") {  // for bookmark visit / creation
                // tabs.query doesn't match fragment identifiers
                url = url.split('#')[0];
                chrome.tabs.query({"url": url}, function (tabs) {
                    getPath(bookmark, function (path) {
                        saveLocal(tabs[0], save, path);
                    });
                });
            }
            else
                saveLocal(tab, save);  // will never need bookmark
        }
    }
}

function saveLocal(tab, automatic, path) {
    // ask user for input if automatic is false
    chrome.pageCapture.saveAsMHTML({tabId: tab.id}, blobToDisk);

    function blobToDisk (mhtmlData) {
        var filename = makeFilename(tab.title);
        var url = URL.createObjectURL(mhtmlData);
        if (automatic === true) {
            chrome.downloads.setShelfEnabled(false); // disable download bar
            chrome.storage.sync.get({archiveDir: "Archiveror"}, function (items) {
                filename = items.archiveDir + path + filename;
                chrome.downloads.download({url: url, filename: filename}, postSave);
            });
        }
        else {
            chrome.downloads.download({url: url, filename: filename,
                                       saveAs: true}, postSave);
        }
    }

    function postSave (downloadId) {
        chrome.downloads.search({id: downloadId}, function (DownloadItems) {
            var download = DownloadItems[0];
            if (download.state === "complete") {
                chrome.downloads.setShelfEnabled(true);
                var key = "_" + tab.url;
                var value = {"id": download.id, "filename": download.filename};
                var data = {};
                data[key] = value;
                chrome.storage.local.set(data, function () {
                    showArchive(tab.url);
                });
            }
            else {
                // wait for 2s, and try again
                window.setTimeout(postSave, 2000, downloadId);
            }
        });
    }

    function makeFilename (title) {
        // Windows disallows <>:"/\|?* in filenames
        var name = title;
        var re = /[<>:"/\\|?]/g;
        name = title.replace(re, "_").trim();
        return name + ".mhtml";
    }
}

// Keyboard shortcuts
chrome.commands.onCommand.addListener(function (command) {
    if (command === "archive-page") {
        var action = function (tabs) {archive_is(tabs[0].url, false);};
    }
    else if (command === "save-local") {
        var action = function (tabs) {saveLocal(tabs[0], false);};
    }
    if (typeof action !== "undefined") {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, action);
    }
});

function newBookmark(id, bookmark) {
    if (bookmark.hasOwnProperty("url")) {
        archive(bookmark.url, true, undefined, bookmark);
    }
}
chrome.bookmarks.onCreated.addListener(newBookmark);

function getPath (bookmark, callback) {
    var nodes = [];
    getParent(bookmark);

    function getParent(bookmark) {
        chrome.bookmarks.get(bookmark.parentId, function (bookmarks) {
            var node = bookmarks[0];
            nodes.push(node.title);
            if (node.parentId)
                getParent(node);
            else
                callback(nodes.reverse().join('/') + '/');
        });
    }
}

// On page visit (check if it's a bookmark)
function bookmarkVisit (tabId, changeInfo, tab) {
    if (changeInfo.status === "complete") {
        chrome.bookmarks.search({url: tab.url}, function (bookmarks) {
            if (bookmarks.length > 0 && bookmarks[0].url === tab.url) {
                // bookmarks[0] propagates to archive function
                showArchive(bookmarks[0].url, bookmarks[0]);
            }
        });
    }
}
chrome.tabs.onUpdated.addListener(bookmarkVisit);
