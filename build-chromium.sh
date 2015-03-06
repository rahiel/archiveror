#!/bin/sh
# Run from archiveror root folder

rm -rf dist/
mkdir dist
cp chromium/* dist
cp LICENSE dist

cd dist
zip archiveror.zip *
