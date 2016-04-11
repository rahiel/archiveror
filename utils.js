// code shared between the extensions

export function get_archiving_url(page, service, email) {
    let url = "https://archive.is/?run=1&url=" + page; // default
    if (service === "archive.org")
        url = "https://web.archive.org/save/" + page;
    else if (service === "webcitation.org") {
        let base = "http://www.webcitation.org/archive?url=";
        url = base + encodeURIComponent(page) + "&email=" + email;
    }
    return url;
}

exports.get_archiving_url = get_archiving_url;
