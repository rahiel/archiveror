#!/usr/bin/env bash
set -euo pipefail

dist="dist/"
BROWSER=$1

rm -rf "$dist"
mkdir "$dist"
find src/ -not -name "*.js" -exec cp '{}' "$dist" \;
cp README.md LICENSE.txt "$dist"
npm run build

echo

rm -f archiveror.zip archiveror-source.zip

if [[ $BROWSER = 'chromium' ]]; then
    cd "$dist"
    # the "applications" key is only supported on Firefox
    jq 'del(.applications)' manifest.json > mani.json
    rm manifest.json
    mv mani.json manifest.json
    cd -
elif [[ $BROWSER = 'firefox' ]]; then
    echo -e "\nMaking archiveror-source.zip for Firefox..."
    zip -r archiveror-source.zip src/ build.bash package.json package-lock.json webpack.config.js README.md LICENSE.txt
else
    echo "Invalid browser choice!"
    exit 1
fi

cd "$dist"
echo -e "\nMaking archiveror.zip..."
zip archiveror.zip *.js *.html *.css *.png manifest.json README.md LICENSE.txt
cd -
mv "$dist"/archiveror.zip ./
