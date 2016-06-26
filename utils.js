// code shared between the extensions

export const services = ["archive.is", "archive.org", "webcitation.org"];

const exclude = ["file://", "about:", "chrome://"];

export function get_archiving_url(page, service, email) {
    for (let i = 0; i < exclude.length; i++) {
        if (page.startsWith(exclude[i]))
            return null;
    }
    let url = "https://archive.is/?run=1&url=" + page; // default
    if (service === "archive.org")
        url = "https://web.archive.org/save/" + page;
    else if (service === "webcitation.org") {
        let base = "http://www.webcitation.org/archive?url=";
        url = base + encodeURIComponent(page) + "&email=" + email;
    }
    return url;
}

// exports for firefox
exports = {
    get_archiving_url: get_archiving_url,
    services: services
};
