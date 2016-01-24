# Created: 2016-01-23
# Author: Bierema Boyz Programming
# Copyright (c) 2016 Bierema Boyz Programming. All rights reserved.

srcJs = $(patsubst src/%,build/lib/%,$(wildcard src/*.js))
libs = $(patsubst lib/%,build/lib/%,$(wildcard lib/*.js))
docs = $(patsubst %,build/%,$(wildcard *.txt))
buildContents = $(docs) build/chessRating.html $(srcJs) \
		build/lib/chessRating.css $(libs) build/examples/tournament1.csv

all: chessRating.zip

buildContents: $(buildContents)

chessRating.zip: $(buildContents)
	cd build; 7z u ../chessRating.zip *

build build/lib build/examples srcMaps:
	mkdir --parents $@

clean:
	rm --recursive --force srcMaps
	rm --recursive --force build
	rm --force chessRating.zip

.SECONDEXPANSION:

$(srcJs): build/lib/%: src/% | $$(@D) srcMaps
	echo -n > srcMaps/$(@F).map
	uglifyjs $< --output $@ --source-map srcMaps/$(@F).map \
		--source-map-root .. --source-map-url ../../srcMaps/$(@F).map --screw-ie8 \
		--mangle --compress --comments

$(docs) $(libs): build/%: % | $$(@D)
	cp $< $@

build/chessRating.html: build/%: src/% | $$(@D)
	cp $< $@

build/lib/chessRating.css: build/lib/%: src/% | $$(@D)
	cp $< $@

build/examples/tournament1.csv: build/examples/%: testInput/% | $$(@D)
	cp $< $@