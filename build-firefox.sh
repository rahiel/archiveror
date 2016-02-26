#!/bin/sh
# Run from archiveror root folder

rm -rf dist/
mkdir dist
mkdir dist/data
cp firefox/data/*.png dist/data/
cp -R firefox/lib/ dist/
cp firefox/package.json dist
cp LICENSE.txt dist

cd dist
jpm xpi
