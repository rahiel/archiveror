// code shared between the extensions

export const services = ["archive.is", "archive.org", "webcitation.org"];

const exclude = ["file://", "about:", "chrome://"];

export function is_local(url) {
    for (let i = 0; i < exclude.length; i++) {
        if (url.startsWith(exclude[i]))
            return true;
    }
    return false;
}

export function get_archiving_url(page, service, email) {
    let url = "https://archive.is/?run=1&url=" + encodeURIComponent(page); // default
    if (service === "archive.org")
        // breaks if page is URI encoded
        url = "https://web.archive.org/save/" + page;
    else if (service === "webcitation.org") {
        let base = "http://www.webcitation.org/archive?url=";
        url = base + encodeURIComponent(page) + "&email=" + encodeURIComponent(email);
    }
    return url;
}

// exports for firefox
exports = {
    get_archiving_url: get_archiving_url,
    services: services
};
