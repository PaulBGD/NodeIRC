NodeIRC [![Build Status](https://travis-ci.org/BurnGames/NodeIRC.svg?branch=master)](https://travis-ci.org/BurnGames/NodeIRC)
====================

A work in progress (including the name)
---------------------

Ideally, this will eventually be a full IRC client.
However all that's been finished is the barebones of networks and logging in.

To Do
- Saving of username and password
- Menu on top for settings and such
- On the left, a tree with Networks their respective Channels
- On the right, a list of users
- On the bottom, a input for chatting

How to help
---------------------
This project is written in NodeJS, however can be compiled into binaries for every OS.


To Run
---------------------
First, install the NPM package "node-webkit-builder". It supplies everything you need to run and build this

    npm install -g node-webkit-builder

Then to run:

    nwbuild -r ./path/to/NodeIRC

Or to build:

    nwbuild -p win32,win64,osx32,osx64,linux32,linux64 -o ./build/directory ./path/to/NodeIRC

That should be all your need to get started hacking away. Pull requests are welcome.