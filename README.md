![website](https://github.com/alpiepho/pup-yt-fcc/workflows/website/badge.svg)


Deployed on GitHub pages [here](https://alpiepho.github.io/pup-yt-fcc/).

:warn: <b>IMPORTANT NOTE</b>: The file **history.html** is manually created:
- login into YouTube
- navigate to "History"
- scroll to bottom (may take a long time)
- use Chrome tools (inspect)
- select top html tag
- right-click and 'copy-outer-html'
- paste into **history.html**
- this became neccessary since YouTube blocks the automated login from Puppeteer.

# pup-yt-fcc

A tool to gather FCC (Free Code Camp) classes completed along with details.

When run as a Node.js tool, it will parse all the Completed Courses of the configured
user, It will save that data as ./artifact/sample.json, and it will generate

- public/index.html

The associated GH Action will deploy the index.html file.  


## Mac Install

Install npm from the website or homebrew.  You will also need yarn.

NOTE: Normally, you can use either npm or yarn to install modules.  The debug of
Chrome with DNS Manager (mising a valid certificate), discovered that we need older
versions of some packages.  This can be done with either npm or yarn.  We currently only
have this setup with the yarn.lock file.

## Linux Install

For a Unbuntu system, use:

<pre>
sudo apt-get install -y npm yarn
</pre>

For other distributions, please search on Google.

## Install then run

First, there is a one-time setup of enviroment variables like:

```
yarn install
```

From a command line:

```
yarn start
```

You can also runs this 'headless' or without a browser window.  Look for 'headless' in site.js.  To verify, you should see the screenshots generated.


## Internal Settings

There are number of things can be changed quickly in the source code.  Eventually they
will be added as program options.

Look for "INTERNAL OPTION".

```
    browserType:     "firefox", // "chrome, firefox"
    headless:        false,     // run without windows
    forceFullGather:  true,     // skip test for number of course
    scrollToBottom:   true,     // scroll page to bottom (WARNING: non-visible thumbnails are not loaded until page is scrolled)
    gatherDetails:    true,     // parse the details
    useSampleData:   false,     // skip browser and use sample data file
    saveSampleData:   true,     // save to sample data file
    screenshot:      false,     // take snapshots
    screenshotDir:    "/tmp/pup_learning_aws_screenshots"
```


### Chromium vs Firefox for Puppeteer

Puppeteer can run automated tests with both Chrome (technically the Chromium build) and
Firefox.

### Headless

Headless is the ability to run a web page without showing on the screen.  This mode can
be used for automated testing.  This works with both Chrome and Firefox.

### Screenshots

This feature allows capturing an image of the web page while the test is running. 

### Local Test of index.html

- cd public
- python -m SimpleHTTPServer
- open http://localhost:8000/

## Know Issues

- options must be set in code


## TODO List:

- set up with GH Actions to run "update" with docker/ubuntu18/node12...
    - get
    - yarn install
    - yarn start
    - verify index
    - commit /public  /artifacts (.md)
- go back to HACK (limit to 10 detail pages per run of tool) DEBUG firefox

## Future changes:

TBD




