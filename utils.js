// code shared between the extensions

export function get_archiving_url(page, service) {
    let url = "https://archive.is/?run=1&url=" + page; // default
    if (service === "archive.org")
        url = "https://web.archive.org/save/" + page;
    return url;
}

exports.get_archiving_url = get_archiving_url;
