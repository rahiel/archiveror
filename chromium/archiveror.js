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
    // Notify user if we have an archive of the current page
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
                    changeBadge(tabs, buttonTitle.present, "!", "#FFB90F");
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

function changeBadge(tabs, title, badgeText, badgeColor) {
    for (var i = 0; i < tabs.length; i++) {
        // Following changes reset automatically when the tab changes
        chrome.browserAction.setTitle({title: title, tabId: tabs[i].id});
        chrome.browserAction.setBadgeText({text: badgeText, tabId: tabs[i].id});
        chrome.browserAction.setBadgeBackgroundColor({color: badgeColor, tabId: tabs[i].id});
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
        else if (text === buttonTitle.default)
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
                    downloadBlock.push(tabs[0].id);
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

function silentDownload(url, filename, path, callback) {
    // silently download to archiveDir
    chrome.downloads.setShelfEnabled(false); // disable download bar
    chrome.storage.sync.get({archiveDir: "Archiveror"}, function (items) {
        filename = items.archiveDir + path + filename;
        chrome.downloads.download({url: url, filename: filename,
                                   conflictAction: "overwrite"}, callback);
    });
}

// When there's something in downloadBlock, moveLocal will wait on already
// moving the (unfinished!) download. This should also prevent bookmarkVisit
// from double archiving a page.
var downloadBlock = [];

function saveDownload(downloadId, url) {
    // save download id and path in local
    chrome.downloads.search({id: downloadId}, function (DownloadItems) {
        var download = DownloadItems[0];
        if (download.state === "complete") {
            chrome.downloads.setShelfEnabled(true);
            var key = "_" + url;
            var value = {"id": download.id, "filename": download.filename};
            var data = {};
            data[key] = value;
            chrome.storage.local.set(data, function () {
                downloadBlock.pop(); // unblock moveLocal for bookmark creation
                showArchive(url);
            });
        }
        else {
            // wait for 200ms, and try again
            window.setTimeout(saveDownload, 200, downloadId, url);
        }
    });
}

function saveLocal(tab, automatic, path) {
    // save page locally in MHTML format
    // ask user for input if automatic is false, else silently download
    if (tab.status !== "complete") {
        // Only save page after it has fully loaded
        changeBadge([tab], "Please wait!", "WAIT", "#d80f30");
        window.setTimeout(function () {
            chrome.tabs.get(tab.id, function (newTab) {
                saveLocal(newTab, automatic, path);
            });
        }, 200);
        return;
    }

    chrome.pageCapture.saveAsMHTML({tabId: tab.id}, blobToDisk);

    function blobToDisk (mhtmlData) {
        var filename = makeFilename(tab.title);
        var url = URL.createObjectURL(mhtmlData);
        if (automatic === true) {
            silentDownload(url, filename, path, function (downloadId) {
                saveDownload(downloadId, tab.url);
            });
        }
        else {
            chrome.downloads.download({url: url, filename: filename, saveAs: true});
        }
    }
}

function sanitizeFilename(title) {
    // Windows disallows <>:"/\|?* in filenames
    var name = title;
    var re = /[<>:"/\\|?]/g;
    name = title.replace(re, "_").trim();
    return name;
}

function makeFilename(title) {
    return sanitizeFilename(title) + ".mhtml";
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
        getBookmarkTree();
    }
}
chrome.bookmarks.onCreated.addListener(newBookmark);

function getPath (bookmark, callback) {
    var nodes = [];
    getParent(bookmark);

    function getParent(bookmark) {
        chrome.bookmarks.get(bookmark.parentId, function (bookmarks) {
            var node = bookmarks[0];
            nodes.push(sanitizeFilename(node.title));
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
        // prevent visit triggering a double archive download (on bookmark creation)
        // bug: doesn't always work...
        if (downloadBlock.indexOf(tabId) > -1) return;
        chrome.bookmarks.search({url: tab.url}, function (bookmarks) {
            if (bookmarks.length > 0 && bookmarks[0].url === tab.url) {
                // bookmarks[0] propagates to archive function
                showArchive(bookmarks[0].url, bookmarks[0]);
            }
        });
    }
}
chrome.tabs.onUpdated.addListener(bookmarkVisit);

function moveLocal(id, moveInfo) {
    // move local archives on bookmark moving
    if (downloadBlock.length > 0) {
        window.setTimeout(moveLocal, 300, id);
        return;
    }

    chrome.bookmarks.get(id, moveBookmark);

    function moveBookmark(bookmarks) {
        var bookmark = bookmarks[0];
        if (bookmark.hasOwnProperty("url")) {
            var key = '_' + bookmark.url;
            chrome.storage.local.get(key, function (items) {
                var data = items[key];
                // check if we need to move anything
                if (typeof data === "undefined") return;  // quit
                var downloadId = data.id;
                var url = data.filename;  // absolute file path
                var filename = makeFilename(bookmark.title);
                getPath(bookmark, function (path) {
                    silentDownload("file://" + url, filename, path, function (newId) {
                        chrome.downloads.removeFile(downloadId, function () {
                            downloadBlock.push(null);
                            saveDownload(newId, bookmark.url);
                            getBookmarkTree();
                        });
                    });
                });
            });
        }
        else {  // bookmark is a directory
            chrome.bookmarks.getChildren(bookmark.id, function(bookmarks) {
                for(var i = 0; i < bookmarks.length; i++) {
                    moveLocal(bookmarks[i].id);
                }
            });

        }
    }
}
chrome.bookmarks.onMoved.addListener(moveLocal);
chrome.bookmarks.onChanged.addListener(moveLocal);

// Block updating bookmarkTree when there's something in bookmarkBlock
var bookmarkBlock = [];
var bookmarkTree;

function getBookmarkTree() {
    if (bookmarkBlock.length > 0) {
        window.setTimeout(getBookmarkTree, 200);
        return;
    }
    chrome.bookmarks.getTree(function(bookmarks) {
        bookmarkTree = bookmarks[0];
    });
}
getBookmarkTree();

function findBookmark(tree, id, callback) {
    // find bookmark in bookmarkTree
    for(var i = 0; i < tree.children.length; i++) {
        if (tree.children[i].id === id) {
            callback(tree.children[i]);
        }
        else if (tree.children[i].hasOwnProperty("children")) {
            findBookmark(tree.children[i], id, callback);
        }
    }
}

function removeBookmark(id, removeInfo) {
    bookmarkBlock.push(null);
    findBookmark(bookmarkTree, id, deleteBookmarkNode);

    function deleteBookmarkNode(bookmarkNode) {
        if (bookmarkNode.hasOwnProperty("children")) {  // directory
            for(var i = 0; i < bookmarkNode.children.length; i++) {
                removeBookmark(bookmarkNode.children[i].id);
            }
            bookmarkBlock.pop();
        }
        else {
            deleteBookmark(bookmarkNode);
        }
    }

    function deleteBookmark(bookmark) {
        bookmarkBlock.pop();
        getBookmarkTree();
        var url = bookmark.url;

        var key = '_' + url;
        chrome.storage.local.get(key, function(items) {
            // What if deleting the file fails?
            chrome.downloads.removeFile(items[key].id);
            chrome.storage.local.remove(key);
        });

        chrome.storage.local.remove(url);

        chrome.tabs.query({"url": url}, function(tabs) {
            changeBadge(tabs, buttonTitle.default, "", "#5dce2d");
        });
    }
}
chrome.bookmarks.onRemoved.addListener(removeBookmark);
