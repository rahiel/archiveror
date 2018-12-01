export const services = ["archive.is", "archive.org", "perma.cc", "webcitation.org"];  // note: doesn't include "mhtml"

export const defaults = {
    archiveBookmarks: true,
    archiveDir: "Archiveror",
    archiveServices: ["archive.is"],
    bookmarkServices: ["archive.is"],
    email: "",
};

export let hasPageCapture;
if (chrome.hasOwnProperty("pageCapture")) {
    hasPageCapture = true;
} else {
    hasPageCapture = false;
}

export function isLocal(url) {
    const blacklist = ["file://", "about:", "chrome://", "http://127.0.0.1", "http://localhost"];
    for (let b of blacklist) {
        if (url.startsWith(b)) return true;
    }
    return false;
}

export function getArchivingURL(page, service, email) {
    let url = "https://archive.is/?run=1&url=" + encodeURIComponent(page); // default
    if (service === "archive.org") {
        // breaks if page is URI encoded
        url = "https://web.archive.org/save/" + page;
    } else if (service === "perma.cc") {
        url = "https://www.perma.cc/service/bookmarklet-create/?v=1&url=" + encodeURIComponent(page);
    } else if (service === "webcitation.org") {
        let base = "http://www.webcitation.org/archive?url=";
        url = base + encodeURIComponent(page) + "&email=" + encodeURIComponent(email);
    }
    return url;
}

export function sanitizeFilename(title) {
    // Chromium disallows <>:"/\|?*~ in filenames (raises an error in chrome.downloads.download)
    let name = title;
    let re = /[<>:"/\\|?*~]/g;
    name = title.replace(re, "_").trim();
    // Chromium disallows filenames starting with a .
    while (name.startsWith(".")) {
        name = name.slice(1);
    }
    return name;
}

export function makeFilename(title, hash) {
    return sanitizeFilename(title) + "_" + getTimestamp() + "_" + hash + ".mhtml";
}

function getTimestamp() {
    let date = new Date();
    let y = date.getUTCFullYear();
    let m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    let d = date.getUTCDate().toString().padStart(2, "0");
    let H = date.getUTCHours().toString().padStart(2, "0");
    let M = date.getUTCMinutes().toString().padStart(2, "0");
    let timestamp = `${y}-${m}-${d}_${H}-${M}`;
    return timestamp;
}

export function writeClipboard(text) {
    // write text to clipboard
    let textarea = document.createElement("textarea");
    textarea.textContent = text;
    document.body.appendChild(textarea);
    let range = document.createRange();
    range.selectNode(textarea);
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    document.body.removeChild(textarea);
}
