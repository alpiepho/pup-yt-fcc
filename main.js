fs = require('fs');

base = require('./base');
site = require('./site');

const HTML_FILE = "./public/index.html";
const SCREENSHOT_DIR = "./screenshots";

const html1 = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width", initial-scale=1.0"/>
    <meta name="Description" content="LinkedIn Learning Courses Completed">
    <meta name="theme-color" content="#d36060"/>
    <title>
    YouTube Video History
    </title>
    <link rel="stylesheet" href="./style.css" />
    <link rel="manifest" href="./manifest.json" />
    <link rel="icon"
      type="image/png" 
      href="./favicon.ico" />
  </head>
  <body class="body">
    <main>
    <article class="page">
      <h1  id=\"top\">YouTube Video History</h1>

      <div class="introduction">
      <p>
      This a summary of all the AWS Training courses I have completed.  These are the
      free online courses.
      </p>
      <p>
      This list is generated from a tool called "pup-yt-fcc" that can be found
      <a
        href="https://github.com/alpiepho/pup-yt-fcc"
        target="_blank"
        rel="noreferrer"
      >here</a>.  This tool needs to be run manually to parse the AWS Training
      site to gather the list of courses I have taken.
      </p>
      </div>
`;

const html2 = `
    <div id=\"bottom\"></div>
    </article>
  </body>
</html>
`;

function build_hours_minutes(data) {
  // Derive timestamps and duration, sort
  // examples
  // "duration": "5 1/2 HOURS",
  // "duration": "2 HOURS",
  // "duration": "100 MINUTES",

  let totalSec = 0;
  data['completed-courses'].forEach(entry => {
    // assume "An Bm" or "Bm"
    try {
      let parts = entry['duration'].replace(',', '').split(' ');
      for (i=0; i<parts.length; i += 2) {
        if (parts[i+1].includes('hour')) {
          val = parseInt(parts[i]);
          totalSec += val*60*60;  
        }
        if (parts[i+1].includes('minute')) {
          val = parseInt(parts[i]);
          totalSec += val*60;  
        }
        if (parts[i+1].includes('second')) {
          val = parseInt(parts[i]);
          totalSec += val;  
        }
      }
    } catch(error) {
    }
    entry['completed-ts'] = Date.parse(entry['registration-date']); // assume registration and completion are close
  });

  let totalMin = Math.floor(totalSec / 60);
  totalD = Math.floor(totalMin / (60*24)); 
  totalMin -= totalD*60*24;
  totalH = Math.floor(totalMin / 60); 
  totalMin -= totalH*60;
  totalM = totalMin;
  return [totalD, totalH, totalM];
}

function build_channel_filter_template(options, data) {
  if (options.channelFilterTemplate.length) {
    channels = [];
    data['completed-courses'].forEach(entry => {
      channels.push('# ' + entry['channel-name']);
    });
    channels = Array.from(new Set(channels));
    // channels.sort((a, b) => (a < b) ? 1 : -1) // ascending
    channels.sort((a, b) => (a < b) ? -1 : 1) // decsending
    fs.writeFileSync(options.channelFilterTemplate, channels.join('\n'));
  }
}

function parse_channel_filter_exclude(options) {
  results = [];
  console.log(options.channelFilterExclude)
  if (options.channelFilterExclude.length) {
    contentStr = fs.readFileSync(options.channelFilterExclude, 'utf8');
    console.log(contentStr.length)
    lines = contentStr.split('\n');
    console.log(lines.length)
    lines.forEach(line => {
      temp = line.trim();
      if (temp[0] != '#') results.push(temp)
    });
  }
  return results;
}



function build_html(options, data, totalD, totalH, totalM) {

  channels_excluded = parse_channel_filter_exclude(options);
  console.log(channels_excluded);
  
  // generate artifacts from data - html
  let htmlStr = html1;

  today = new Date()
  htmlStr += "<sup><sub>(updated " + today + ")</sub></sup>\n\n"

  totalH += totalD*24;
  htmlStr += "      <br/><p>Totals - Course: " + data['completed-courses'].length + ", Time: " + totalH + "h " + totalM + "m</p><br/>\n\n";
  htmlStr += "      <ul>\n";
  data['completed-courses'].forEach(entry => {
    if (channels_excluded.includes(entry['channel-name'])) {}
    else {
      htmlStr += "            <li>\n";
      temp = "";
      htmlStr += "              <hr class=\"" + temp + "\">\n";
      htmlStr += "              <ul>\n";
      htmlStr += "                <li>\n";
      htmlStr += "                <p><img src=\"" + entry['thumbnail'] + "\" loading=\"lazy\"</img></p>\n";
      htmlStr += "                </li>\n";
      htmlStr += "                <li>\n";
      htmlStr += "                  <a target=\"_blank\" href=\"" + entry['link'] + "\">\n";
      htmlStr += "                    " + entry['title'] + "\n";
      htmlStr += "                  </a>  ";
      htmlStr += "                </li>\n";
      htmlStr += "                <li>\n";
      htmlStr += "                  <a target=\"_blank\" href=\"" + entry['channel-link'] + "\">\n";
      htmlStr += "                    " + entry['channel-name'] + "\n";
      htmlStr += "                  </a>  ";
      htmlStr += "                </li>\n";
      htmlStr += "                <li class=\"duration\">" + entry['duration'].toLowerCase() + "</li>\n";
      htmlStr += "                <li class=\"completed\"><i>Watched: " + entry['watched-date'] + "</i></li>\n";
      htmlStr += "                <li class=\"description\">" + entry['description'] + "</li>\n";
      htmlStr += "                <li class=\"topbottom\"><a href=\"#top\">top</a> / <a href=\"#bottom\">bottom</a></li>\n";
      htmlStr += "              </ul>\n";
      htmlStr += "            </li>\n";
    }
 });
  htmlStr += "      </ul>";
  htmlStr += html2;
  fs.writeFileSync(HTML_FILE, htmlStr);
}


const main = async () => {
  // INTERNAL OPTIONS
  options = { 
    browserType:     "chrome", // "chrome, firefox" // WARNING: hit limit on number of detail pages with firefox
    headless:        false,     // run without windows
    forceFullGather:  true,     // skip test for number of course
    scrollToBottom:   true,     // scroll page to bottom (WARNING: non-visible thumbnails are not loaded until page is scrolled)
    gatherDetails:    false,     // parse the details
    useSampleData:    false,     // skip browser and use sample data file
    saveSampleData:   true,     // save to sample data file
    saveSampleChannelFilters: true,
    channelFilterTemplate: "channelFilterTemplate.txt", // list if channels as a template
    //channelFilterExclude:  "",
    channelFilterInclude:  "",
    channelFilterExclude:  "channelFilterExclude.txt",  // list of all channels to exclude
    // channelFilterInclude:  "channelFilterInclude.txt",  // list of all channels to include
    saveChannelFilterExclude: true,

    screenshot:      false,     // take snapshots
    screenshotDir:   SCREENSHOT_DIR
  }
  const browser = await base.browser_init(options);
  if (!options.useSampleData) {
    options.version = await browser.version();
  }
  console.log("options:");
  console.log(options);

  // login, get list of completed courses, logout
  data = {}
  await site.process_completed(browser, options, data);
  await base.browser_close(browser);

  if (data['completed-courses'].length > 0) {
    [totalD, totalH, totalM] = build_hours_minutes(data);
    //data['completed-courses'].sort((a, b) => (a['watched-yyyymmdd'] < b['watched-yyyymmdd']) ? 1 : -1) // ascending
    //data['completed-courses'].sort((a, b) => (a['watched-yyyymmdd'] < b['watched-yyyymmdd']) ? -1 : 1) // decsending
    build_channel_filter_template(options, data);
    build_html(options, data, totalD, totalH, totalM);
  }

  console.log("done.");
};

main();

  
  
/*
- fix sort
- more details? (navigate?)
- filter - in
- filter - out
*/