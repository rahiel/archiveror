#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

dist="dist/"
BROWSER=$1

rm -rf "$dist"
mkdir "$dist"
find src/ -not -name "*.js" -exec cp '{}' "$dist" \;
cp LICENSE.txt "$dist"
npm run build

cd "$dist"
if [[ $BROWSER = 'chromium' ]]; then
    # the "applications" key is only supported on Firefox
    jq 'del(.applications)' manifest.json > mani.json
    rm manifest.json
    mv mani.json manifest.json
fi

zip archiveror.zip *.js *.html *.css *.png manifest.json LICENSE.txt
