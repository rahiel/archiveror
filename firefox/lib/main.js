const bookmarks = require("./bookmarks");
const buttons = require('sdk/ui/button/action');
const clipboard = require("sdk/clipboard");
const Hotkey = require("sdk/hotkeys").Hotkey;
const preferences = require("sdk/simple-prefs");
const Request = require("sdk/request").Request;
const ss = require("sdk/simple-storage");
const tabs = require('sdk/tabs');

function archive(url) {
    // silently submit url to archive.is
    const r = Request({
        url: "https://archive.is/submit/",
        content: {"url": url, "anyway": 1},
        onComplete: function (response) {
            // Extract link from response
            let link = response.text.match(/(https?:\/\/archive.is\/\w+)/)[0];
            postArchive(url, link);
        }
    }).post();
}

function postArchive(url, link) {
    data[url] = link;
    showArchive(url);
}

// Store archive links for bookmarks
if (!ss.storage.data)
    ss.storage.data = {};
let data = ss.storage.data;


const defaultButton = {label: "Archive Page",
                       icon: {"16": "./icon-16.png",
                              "32": "./icon-32.png",
                              "64": "./icon-64.png"}
                      };

const showButton = {label: "Go to archived page",
                    icon: {"16": "./icon-16-star.png",
                           "32": "./icon-32-star.png",
                           "64": "./icon-64-star.png"}
                   };

let button = buttons.ActionButton({
    id: "archive-button",
    label: defaultButton.label,
    icon: defaultButton.icon,
    onClick: function (state) {
        if (button.state("tab").label === defaultButton.label)
            archivePage();
        else
            tabs.open(data[tabs.activeTab.url]);
    }
});

function archivePage() {
    tabs.open({
        url: "https://archive.is/?run=1&url=" +
            encodeURIComponent(tabs.activeTab.url),
        onReady: function () {
            clipboard.set(tabs.activeTab.url);
        }});
}

// Make a hotkey to archive current page
let archiveKey;
function setArchiveKey() {
    if (archiveKey !== undefined)
        archiveKey.destroy();
    archiveKey = Hotkey({
        combo: preferences.prefs.archiveKey,
        onPress: archivePage
    });
}
setArchiveKey();

function showArchive(url) {
    // If we have archived a bookmark, change the icon to reflect this and
    // let the button open the archive link.
    if (url in data) {
        button.state("tab", showButton);
        // and reset the button when we change the page again
        resetButton();
    } else
        autoArchive(url);

    function resetButton() {
        const currentTab = tabs.activeTab;
        currentTab.once("ready", function () {
            if (!(tabs.activeTab.url in data)) {
                button.state(currentTab, defaultButton);
            } else
                resetButton();
        });
    }
}

function autoArchive(url) {
    if (preferences.prefs.archiveBookmarks === true) {
        archive(url);
    }
}

exports.main = function () {
    // archive newly made bookmarks
    bookmarks.on("added", autoArchive);
    // Inform user we have an archive of their bookmark
    bookmarks.on("visited", showArchive);
    // listen for pref change
    preferences.on("archiveKey", setArchiveKey);
};

exports.onUnload = function () {
    bookmarks.removeListener("added", archive);
    bookmarks.removeListener("visited", showArchive);
    preferences.removeListener("archiveKey", setArchiveKey);
};
