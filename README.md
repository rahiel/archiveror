# Archiveror

[![Build Status](https://travis-ci.org/rahiel/archiveror.svg?branch=master)](https://travis-ci.org/rahiel/archiveror)
[![License](https://img.shields.io/badge/License-GPLv3+-blue.svg)](https://github.com/rahiel/archiveror/blob/master/LICENSE.txt)

Archiveror is a browser extension that archives webpages by submitting them to
<https://archive.is>, <https://archive.org> and other archiving services. These
archives are publicly available, so you then have a backup that you can refer to
in case the original falls prey to [link rot][].

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

[link rot]: https://en.wikipedia.org/wiki/Link_rot

## Archiving Services

Archiveror supports several online archiving service. You can choose which one
to use for manual archiving at the options. You can also select multiple
services to archive a single page in multiple web archives.

- [**archive.is**](https://archive.is), launched in 2012. Blocks (some)
  advertising and (user tracking) JavaScript. Links:
  [Example](https://archive.is/N0yex), [FAQ][faq-archive.is],
  [Wikipedia][wiki-archive.is].
- [**archive.org**](https://archive.org/web/), launched in 2001. Respects
  [robots.txt][robot] so it cannot archive all webpages. Links:
  [Example](https://web.archive.org/web/20160420095454/http://physics.weber.edu/schroeder/md/),
  [FAQ][faq-archive.org], [Wikipedia][wiki-archive.org].
- [**perma.cc**](https://perma.cc/), launched in 2013. Founded by the Harvard
  Law School Library. Provides accounts to manage archived links. Free accounts
  can create 10 archives per month. Links:
  [Example](https://perma.cc/M8Q2-B8FY), [FAQ][faq-perma].
- [**webcitation.org**](http://www.webcitation.org), launched in 1997, respects
  robots.txt. You need to set an email address at the options to use it. Has a
  focus on academic users. Links:
  [Example](http://www.webcitation.org/6guJcxnyr), [FAQ][faq-webcite],
  [Wikipedia][wiki-webcite].

[robot]: https://en.wikipedia.org/wiki/Robots_exclusion_standard
[faq-archive.is]: https://archive.is/faq
[faq-archive.org]: https://archive.org/about/faqs.php#The_Wayback_Machine
[faq-perma]: https://perma.cc/docs/faq
[faq-webcite]: https://www.webcitation.org/faq
[wiki-archive.is]: https://en.wikipedia.org/wiki/Archive.is
[wiki-archive.org]: https://en.wikipedia.org/wiki/Internet_Archive
[wiki-webcite]: https://en.wikipedia.org/wiki/WebCite

## Local Saving

Archiveror can also make local copies of webpages. One page will be saved in a
single [MHTML][] file. Bookmarks will be saved automatically. Pages can also be
manually saved by either clicking the button or pressing Ctrl+Shift+S. The
filenames end with the UTC date and time of when the archive was made.

To enable local archiving, right click the Archiveror button, go to the options
and then pick "Local".

In local archiving mode your bookmarks will be saved in your Downloads directory
following your bookmark structure. If you move your bookmarks around, Archiveror
will mirror your changes and likewise move your local archives. For this to work
you need to check "Allow access to file URLs" at the extensions page. Go to your
extensions and enable it: <https://i.imgur.com/ahrfe3M.png>.

Local saving is currently only available for Chromium, vote
for [this bug][1261339] if you want this feature on Firefox. Alternatively
consider the [Save Page WE][] add-on.

[MHTML]: https://en.wikipedia.org/wiki/MHTML
[1261339]: https://bugzilla.mozilla.org/show_bug.cgi?id=1261339
[Save Page WE]: https://addons.mozilla.org/firefox/addon/save-page-we/

## Installation

* [Chromium](https://chrome.google.com/webstore/detail/archiveror/cpjdnekhgjdecpmjglkcegchhiijadpb)
* [Firefox](https://addons.mozilla.org/firefox/addon/archiveror/)

## Credits

* The [floppy disk icon][floppy] is by the
  artist [sixsixfive](https://sixsixfive.deviantart.com/) and was generously
  released into the public domain.
* This extension would not be possible without the free archiving services
  provided by <https://archive.is>, <https://archive.org>, <https://perma.cc/>
  and <http://www.webcitation.org>.
* The essay [Archiving URLs](https://www.gwern.net/Archiving-URLs) by Gwern
  Branwen served as inspiration for this add-on.

[floppy]: https://openclipart.org/detail/211780/matt-icons_media-floppy-by-sixsixfive-211780
