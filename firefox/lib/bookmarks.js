// from: https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Creating_event_targets (https://archive.today/O62L2)
/* global XPCOMUtils */
var { emit, on, once, off } = require("sdk/event/core");

var {Cc, Ci, Cu} = require("chrome");
Cu.import("resource://gre/modules/XPCOMUtils.jsm", this);
var bookmarkService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
        .getService(Ci.nsINavBookmarksService);

var bookmarkObserver = {
    onItemAdded: function (aItemId, aFolder, aIndex) {
        emit(exports, "added", bookmarkService.getBookmarkURI(aItemId).spec);
    },
    onItemVisited: function (aItemId, aVisitID, time) {
        emit(exports, "visited", bookmarkService.getBookmarkURI(aItemId).spec);
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsINavBookmarkObserver])
};

bookmarkService.addObserver(bookmarkObserver, false);

exports.on = on.bind(null, exports);
exports.once = once.bind(null, exports);
exports.removeListener = function removeListener(type, listener) {
    off(exports, type, listener);
};
