#!/bin/sh
# Run from archiveror root folder

dist="dist-chromium/"

rm -rf "$dist"
mkdir "$dist"
find chromium/ -not -name "*.js" -exec cp '{}' "$dist" \;
npm run build
cp LICENSE.txt "$dist"

cd "$dist"
zip archiveror.zip ./*
