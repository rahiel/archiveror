#!/bin/sh
# Run from archiveror root folder

rm -rf dist/
mkdir dist
mkdir dist/data
cp data/*.png dist/data/
cp -R lib/ dist/
cp package.json dist
cp LICENSE dist

cd dist
jpm xpi
