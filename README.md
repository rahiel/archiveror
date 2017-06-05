# Archiveror

[![Build Status](https://travis-ci.org/rahiel/archiveror.svg?branch=master)](https://travis-ci.org/rahiel/archiveror)
[![License](https://img.shields.io/badge/License-GPLv3+-blue.svg)](https://github.com/rahiel/archiveror/blob/master/LICENSE.txt)

Archiveror is a browser extension that archives webpages by submitting them to
<https://archive.is>, <https://archive.org> and other archiving services. These
archives are publicly available, so you then have a backup that you can refer to
in case the original falls prey to
[link rot](https://en.wikipedia.org/wiki/Link_rot).

Archiveror will also preserve your bookmarks by automatically archiving them in
the background. Its icon will change when you visit a bookmark it has archived,
clicking on it opens the page on the archive. Archiving of bookmarks happens
when you make a new bookmark and when you open an old bookmark. This can be
disabled.

You can manually archive webpages by clicking on the icon, using the Alt+Shift+Y
hotkey (configurable), or via the page's right click context menu. The URL for
the archive is then copied to your clipboard, so you can easily paste the link
for references and citations.

Happy archiving!

## Archiving Services

Archiveror supports several online archiving service. You can choose which one
to use for manual archiving at the options. You can also select multiple
services to archive a single page in multiple web archives.

- [**archive.is**](https://archive.is), launched in 2012. Blocks (some)
  advertising and (user tracking) JavaScript.
  [Example](https://archive.is/N0yex)
- [**archive.org**](https://archive.org/web/), launched in 2001. Respects
  [robots.txt][robot] so it cannot archive all webpages.
  [Example](https://web.archive.org/web/20160420095454/http://physics.weber.edu/schroeder/md/)
- [**webcitation.org**](http://www.webcitation.org), launched in 1997, respects
  robots.txt. You need to set an email address at the options to use it. Has a
  focus on academic users. [Example](http://www.webcitation.org/6guJcxnyr)

[robot]: https://en.wikipedia.org/wiki/Robots_exclusion_standard

## Local Saving

Archiveror can also make local copies of webpages. One page will be saved in a
single [MHTML](https://en.wikipedia.org/wiki/MHTML) file. Bookmarks will be
saved automatically. Pages can also be manually saved by either clicking the
button or pressing Ctrl+Shift+S.

To enable local archiving, right click the Archiveror button, go to the options
and then pick "Local".

In local archiving mode your bookmarks will be saved in your Downloads directory
following your bookmark structure. If you move your bookmarks around, Archiveror
will mirror your changes and likewise move your local archives. For this to work
you need to check "Allow access to file URLs" at the extensions page. Go to your
extensions and enable it: <https://i.imgur.com/ahrfe3M.png>.

Local saving is currently only available for Chromium, vote
for [this bug][1261339] if you want this feature on Firefox. Alternatively
consider the [Mozilla Archive Format][maff] or [UnMHT][] add-ons.

[1261339]: https://bugzilla.mozilla.org/show_bug.cgi?id=1261339
[maff]: https://addons.mozilla.org/firefox/addon/mozilla-archive-format/
[unmht]: https://addons.mozilla.org/firefox/addon/unmht/

## Installation

* [Chromium](https://chrome.google.com/webstore/detail/archiveror/cpjdnekhgjdecpmjglkcegchhiijadpb)
* [Firefox](https://addons.mozilla.org/firefox/addon/archiveror/)

## Credits

* The [floppy disk icon][floppy] is by the
  artist [sixsixfive](https://sixsixfive.deviantart.com/) and was generously
  released into the public domain.
* This extension would not be possible without the free archiving services
  provided by <https://archive.is>, <https://archive.org> and
  <http://www.webcitation.org>.
* The essay [Archiving URLs](http://www.gwern.net/Archiving%20URLs) by Gwern
  Branwen served as inspiration for this add-on.

[floppy]: https://openclipart.org/detail/211780/matt-icons_media-floppy-by-sixsixfive-211780
