#!/bin/sh
# Run from archiveror root folder

dist="dist-firefox/"

rm -rf "$dist"
mkdir -p "$dist"/data
cp firefox/data/*.png "$dist"/data/
npm run build
cp firefox/package.json "$dist"
cp LICENSE.txt "$dist"

npm run xpi
