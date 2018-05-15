import {
    defaults, getArchivingURL, hasPageCapture, isLocal, makeFilename, sanitizeFilename, services, writeClipboard
} from "./utils.js";


function archive_is(url) {
    if (isLocal(url)) return;
    const service = "archive.is";
    let request = new XMLHttpRequest();
    request.open("POST", "https://archive.is/submit/", true);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    let params = "url=" + encodeURIComponent(url);
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            let link = request.responseURL;
            postArchive(url, service, link);
        }
    };
    request.send(params);
}

function archive_org(url) {
    if (isLocal(url)) return;
    const service = "archive.org";
    const baseURL = "https://web.archive.org";
    const re = /"\/web\/\d+\/.+?"/;
    fetch(getArchivingURL(url, service, "")).then(function (response) {
        if (response.ok) {
            response.text().then(function (text) {
                const archive = text.match(re)[0].slice(1, -1);
                const link = baseURL + archive;
                postArchive(url, service, link);
            });
        }
    });
}

// lock to prevent postArchive from losing data when invoked multiple times concurrently
let archiveLock = false;

function postArchive(url, service, data) {
    // storage: {url1: {service1: data1, service2: data2, ...}, url2: {service: data}, ...}
    // data is an URL string for online archives, for mhtml search for "mhtml data format"
    if (!archiveLock) archiveLock = true;
    else return window.setTimeout(postArchive, 300, url, service, data);
    chrome.storage.local.get(url, function (items) {
        if (items[url]) {
            items[url][service] = data;
        } else {
            items[url] = {[service]: data};
        }
        chrome.storage.local.set(items, function () {
            archiveLock = false;
            showArchive(url);
        });
    });
}

function archiveOnline(url, services) {
    // archive url online at services (a list of strings)
    if (isLocal(url)) return;  // don't archive internal pages, "file://", "chrome://", etc.
    let tabId, link;
    chrome.storage.local.get({archiveServices: defaults.archiveServices, email: defaults.email}, function (items) {
        if (services === undefined) {
            services = items.archiveServices;
        }
        services = services.filter(s => s !== "mhtml");
        for (let service of services) {
            link = getArchivingURL(url, service, items.email);

            chrome.tabs.create({url: link}, function (tab) {
                tabId = tab.id;
                // support updating clipboard with new link from archive.is "save the page again"
                chrome.tabs.onUpdated.addListener(URLToClipboard);
                chrome.tabs.onRemoved.addListener(URLToClipboard);
            });
        }
    });

    let re = /.*(?:archive|perma|webcitation)\.(?:is|cc|org).*/;
    function URLToClipboard(thisTabId, changeInfo, tab) {
        if (thisTabId !== tabId) return;  // ignore other tabs
        // remove listeners if the tab was closed and if user navigated away from archive
        if (changeInfo.hasOwnProperty("isWindowClosing") || !re.test(tab.url)) {
            chrome.tabs.onUpdated.removeListener(URLToClipboard);
            chrome.tabs.onRemoved.removeListener(URLToClipboard);
        } else {
            writeClipboard(tab.url);
        }
    }
}

// archive requests from popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.label === "archiveOnline") {
        archiveOnline(message.url, message.services);
    } else if (message.label === "saveLocal") {
        chrome.tabs.get(message.tabId, function (tab) {
            saveLocal(tab, false);
        });
    } else if (message.label === "archiveNow") {
        archiveNow(message.url, message.tabId);
    }
});

function archiveNow(url, tabId) {
    chrome.storage.local.get({archiveServices: defaults.archiveServices}, function (items) {
        const services = items.archiveServices;
        archiveOnline(url, services);
        if (services.includes("mhtml")) {
            chrome.tabs.get(tabId, function (tab) {
                saveLocal(tab, false);
            });
        }
    });
}

function showArchive(url, bookmark) {
    // Notify user if we have an archive of the current page, otherwise archive if needed
    let keys = {
        [url]: false,
        archiveBookmarks: defaults.archiveBookmarks,
        bookmarkServices: defaults.bookmarkServices
    };
    chrome.storage.local.get(keys, showBadge);

    function showBadge(items) {
        let taburl = url.split("#")[0];
        chrome.tabs.query({"url": taburl}, function (tabs) {
            let save = (items.archiveBookmarks === true);

            if (items[url] !== false) {
                changeBadge(tabs, badgeStyles.alert);
            }

            function shouldArchive(service) {
                return items.bookmarkServices.includes(service) && (!items[url] || !items[url].hasOwnProperty(service));
            }

            if (save) {
                if (shouldArchive("archive.is")) archive_is(url);
                if (shouldArchive("archive.org")) archive_org(url);
                if (shouldArchive("mhtml")) {
                    downloadBlock.push(tabs[0].id);
                    getPath(bookmark, function (path) {
                        saveLocal(tabs[0], save, path);
                    });
                }
            }
        });
    }
}

function changeBadge(tabs, style) {
    const [title, badgeText, badgeColor] = style;
    for (let t of tabs) {
        // Following changes reset automatically when the tab changes
        chrome.browserAction.setTitle({title: title, tabId: t.id});
        chrome.browserAction.setBadgeText({text: badgeText, tabId: t.id});
        chrome.browserAction.setBadgeBackgroundColor({color: badgeColor, tabId: t.id});
    }
}
const badgeStyles = {
    default: ["Archiveror", "", "#5dce2d"],
    alert: ["Archiveror (bookmark archived)", "!", "#FFB90F"],
    wait: ["Archiveror (busy)", "WAIT", "#d80f30"],
};

function silentDownload(url, filename, path, callback) {
    // silently download to archiveDir
    chrome.storage.local.get({archiveDir: defaults.archiveDir}, function (items) {
        filename = items.archiveDir + path + filename;
        chrome.downloads.download({
            url: url, filename: filename, saveAs: false, conflictAction: "overwrite"}, callback);
    });
}

// When there's something in downloadBlock, moveLocal will wait on already
// moving the (unfinished!) download. This should also prevent bookmarkVisit
// from double archiving a page.
let downloadBlock = [];

function saveDownload(downloadId, url) {
    // save download id and path in local
    chrome.downloads.search({id: downloadId}, function (DownloadItems) {
        let download = DownloadItems[0];
        if (download.state === "complete") {
            const service = "mhtml";
            let data = {"id": download.id, "filename": download.filename}; // mhtml data format

            downloadBlock.pop(); // unblock moveLocal for bookmark creation
            postArchive(url, service, data);

            chrome.downloads.setShelfEnabled(false); // hide download shelf
            window.setTimeout(function () {
                chrome.downloads.setShelfEnabled(true);
            }, 100);
        } else {
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
        changeBadge([tab], badgeStyles.wait);
        window.setTimeout(function () {
            chrome.tabs.get(tab.id, function (newTab) {
                saveLocal(newTab, automatic, path);
            });
        }, 200);
        return;
    }

    chrome.pageCapture.saveAsMHTML({tabId: tab.id}, blobToDisk);

    function blobToDisk(mhtmlData) {
        let filename = makeFilename(tab.title);
        let url = URL.createObjectURL(mhtmlData);
        if (automatic === true) {
            silentDownload(url, filename, path, function (downloadId) {
                saveDownload(downloadId, tab.url);
            });
        } else {
            chrome.downloads.download({url: url, filename: filename, saveAs: true}, function (downloadId) {
                changeBadge([tab], badgeStyles.default);
            });
        }
    }
}

// Keyboard shortcuts
chrome.commands.onCommand.addListener(function (command) {
    let action = false;
    if (command === "archive-now") {
        action = function (tabs) { archiveNow(tabs[0].url, tabs[0].id); };
    } else if (command === "save-local") {
        action = function (tabs) { saveLocal(tabs[0], false); };
    }
    if (action !== false) {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, action);
    }
});

// context menu
chrome.contextMenus.removeAll(function () {
    let contexts = ["page", "link"];
    let menu = chrome.contextMenus.create({
        title: "Archive",
        id: "context-menu",
        contexts: contexts,
    });
    for (let service of services) {
        chrome.contextMenus.create({
            title: service,
            id: service,
            parentId: menu,
            contexts: contexts,
        });
    }
    if (hasPageCapture) {
        contexts = ["page"];
        chrome.contextMenus.create({type: "separator", id: "separator", parentId: menu, contexts: contexts});
        chrome.contextMenus.create({title: "Save MHTML as...", id: "MHTML", parentId: menu, contexts: contexts});
    }
});
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId === "MHTML") {
        saveLocal(tab, false);
    } else if (info.linkUrl) {
        archiveOnline(info.linkUrl, [info.menuItemId]);
    } else if (info.pageUrl) {
        archiveOnline(info.pageUrl, [info.menuItemId]);
    }
});

function newBookmark(id, bookmark) {
    if (bookmark.hasOwnProperty("url")) {
        showArchive(bookmark.url, bookmark);
    }
}
chrome.bookmarks.onCreated.addListener(newBookmark);

function getPath(bookmark, callback) {
    let nodes = [];
    getParent(bookmark);

    function getParent(bookmark) {
        chrome.bookmarks.get(bookmark.parentId, function (bookmarks) {
            let node = bookmarks[0];
            nodes.push(sanitizeFilename(node.title));
            if (node.parentId) {
                getParent(node);
            } else {
                callback(nodes.reverse().join("/") + "/");
            }
        });
    }
}

// On page visit (check if it's a bookmark)
function bookmarkVisit(tabId, changeInfo, tab) {
    if (changeInfo.status === "complete") {
        // prevent visit triggering a double archive download (on bookmark creation)
        // bug: doesn't always work...
        if (downloadBlock.indexOf(tabId) > -1) return;
        chrome.bookmarks.search({url: tab.url}, function (bookmarks) {
            if (bookmarks.length > 0 && bookmarks[0].url === tab.url) {
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
        let bookmark = bookmarks[0];
        if (bookmark.hasOwnProperty("url")) {
            let key = bookmark.url;
            chrome.storage.local.get(key, function (items) {
                let data = items[key];
                // check if we need to move anything
                if ((typeof data === "undefined") || (typeof data.mhtml === "undefined")) return;
                let downloadId = data.mhtml.id;
                let url = data.mhtml.filename;  // absolute file path
                let filename = makeFilename(bookmark.title);
                getPath(bookmark, function (path) {
                    silentDownload("file://" + url, filename, path, function (newId) {
                        chrome.downloads.removeFile(downloadId, function () {
                            downloadBlock.push(null);
                            saveDownload(newId, bookmark.url);
                        });
                    });
                });
            });
        } else {  // bookmark is a directory
            chrome.bookmarks.getChildren(bookmark.id, function (bookmarks) {
                for (let b of bookmarks) {
                    moveLocal(b.id);
                }
            });

        }
    }
}
chrome.bookmarks.onMoved.addListener(moveLocal);
chrome.bookmarks.onChanged.addListener(moveLocal);

function removeBookmark(id, removeInfo) {
    let node = removeInfo.node;

    if (node.hasOwnProperty("children")) {  // directory
        for (let child of node.children) {
            removeBookmark(child.id, {node: child});
        }
    } else {
        deleteBookmark(node);
    }

    function deleteBookmark(bookmark) {
        let url = bookmark.url;

        chrome.tabs.query({"url": url}, function (tabs) {
            changeBadge(tabs, badgeStyles.default);
        });

        chrome.storage.local.get(url, function (items) {
            chrome.storage.local.remove(url);
            // What if deleting the file fails?
            if (hasPageCapture && items.hasOwnProperty(url) && items[url].hasOwnProperty("mhtml")) {
                chrome.downloads.removeFile(items[url].mhtml.id);
            }
        });

    }
}
chrome.bookmarks.onRemoved.addListener(removeBookmark);

// Migration code
chrome.runtime.onInstalled.addListener(function (details) {
    // Migrate deprecated "archiveMode" setting. TODO: remove this (from April 2018)
    let key = "archiveMode";
    chrome.storage.local.get({[key]: false, bookmarkServices: defaults.bookmarkServices}, function (items) {
        const archiveMode = items[key];
        if (archiveMode !== false) {
            if (archiveMode === "local") {
                let bookmarkServices = items.bookmarkServices;
                if (!bookmarkServices.includes("mhtml")) {
                    bookmarkServices.push("mhtml");
                    chrome.storage.local.set({bookmarkServices: bookmarkServices});
                }
            }
            chrome.storage.local.remove(key);
        }
    });

    // Migrate to new data format TODO: remove this (from May 2018)
    chrome.storage.local.get(null, function (items) {
        for (let k of Object.keys(items)) {
            if (typeof items[k] === "string") {
                let link = items[k];
                if (link.startsWith("http")) {
                    items[k] = {"archive.is": link};
                }
            }
        }
        for (let k of Object.keys(items)) {
            if (k.startsWith("_")) {
                let url = k.slice(1);
                if (items.hasOwnProperty(url)) {
                    items[url].mhtml = items[k];
                } else {
                    items[url] = {"mhtml": items[k]};
                }
                delete items[k];
                chrome.storage.local.remove(k);
            }
        }
        chrome.storage.local.set(items);
    });
});
