require("dotenv").config();
base = require('./base');
fs = require('fs');

PUP_URL_BASE="https://www.youtube.com";

// in ms
PAGE_WAIT = 1000;
PAGE_WAIT_COMPLETED = 3000;
PAGE_WAIT_DETAILS = 3000;
PAGE_WAIT_DETAILS_RETRY = 20000;

const SAMPLE_FILE = "./artifacts/sample.json";


const sampleData = require(SAMPLE_FILE);


const process_course_details = async (page, options, href) => {
  console.log("process_course_details: " + href);
  var newdata = {};
  newdata['description'] = "";
  newdata['duration'] = "";
  newdata['level'] = "";
  newdata['prereqsuisites'] = "";

  await base.browser_get_filtered(page, href, PAGE_WAIT_DETAILS);

  newdata = await page.evaluate(() => {
    let result = {};
    // parse: courses
    result['description'] = "";
    result['duration'] = "";
    result['level'] = "";
    result['prereqsuisites'] = [];
    result['type'] = "";

    //#app-root > div.page > div.css-70bgut > div.css-16a6yr3 > div.css-t6x1i7 > header > div > div:nth-child(1) > span > span
    temp = document.querySelectorAll('div [data-testid="LoDetailsLoDescriptionText"] div p');
    if (temp.length) {
      result['description'] = temp[0].innerText;
    }

    temp = document.querySelectorAll('div:nth-child(1) > span > span');
    if (temp.length) {
      result['type'] = temp[0].innerText;
    }
    temp = document.querySelectorAll('#about span:nth-child(1) span');
    if (temp.length) {
      result['level'] = temp[0].innerText;
    }
    temp = document.querySelectorAll('#about span:nth-child(2) span');
    if (temp.length) {
      result['duration'] = temp[0].innerText;
    }

    temp = document.querySelectorAll('div [data-testid="LoDetailsLoDescriptionText"] a');
    for (index = 0; index < temp.length; index++) {
      entry = {}
      entry['title'] = temp[index].innerText;
      entry['href'] = temp[index].href;
      result['prereqsuisites'].push(entry);
    }
    return result;
  });

  //console.log("process_course_details done");
  console.log(newdata)
  return [newdata['description'], newdata['level'], newdata['duration'], newdata['prereqsuisites'], newdata['type']];
};

const process_completed = async (browser, options, data) => {
  console.log("process_completed");
  var newdata;

  if (options.useSampleData) {
    newdata = sampleData;
  } else {
    // const page = await base.browser_get(
    //   browser,
    //   PUP_URL_BASE,
    //   PAGE_WAIT_COMPLETED
    // );

    newdata = {};
    newdata['completed-courses'] = []

    // manually parse history.html (from Chrome inspect copy-outer-html after logging in,)
    var contentHtml = fs.readFileSync('./history.html', 'utf8');
    console.log(contentHtml.length)
    var index1 = 0;
    var index2 = 0;
    //var count = 0;
    var entry;
    var date_label = "";
    while (index1 != -1 && index1 < contentHtml.length) {
      entry = {};

      // possible date-label (will adjust 'Today', 'Yesterday', etc. later)
      last1 = index1;
      index1 = contentHtml.indexOf('<div id="title" class="style-scope ytd-item-section-header-renderer">', index1);
      if (index1 == -1) index1 = last1;
      else {
        index1 += '<div id="title" class="style-scope ytd-item-section-header-renderer">'.length;
        index2 = contentHtml.indexOf('</div>', index1);
        date_label = contentHtml.substring(index1, index2);
        console.log(date_label)
        index1 = index2;
      }


      // get start of next entry
      last1 = index1;
      index1 = contentHtml.indexOf('<a id="thumbnail"', index1);
      if (index1 == -1) break;

      // get link from href
      last1 = index1;
      index1 = contentHtml.indexOf('href="', index1);
      if (index1 == -1) index1 = last1;
      else {
        index1 += 'href="'.length;
        index2 = contentHtml.indexOf('">', index1);
        entry['link'] = PUP_URL_BASE + contentHtml.substring(index1, index2);
        index1 = index2;
      }

      // get thumbnail
      last1 = index1;
      index1 = contentHtml.indexOf('<img id="img"', index1);
      if (index1 == -1) index1 = last1;
      else {
        index1 = contentHtml.indexOf('src="', index1);
        index1 += 'src="'.length;
        index2 = contentHtml.indexOf('">', index1);
        entry['thumbnail'] = contentHtml.substring(index1, index2);
        index1 = index2;
      }

      // get duration (from thumbnail overlay)
      last1 = index1;
      index1 = contentHtml.indexOf('aria-label="', index1);
      if (index1 == -1) index1 = last1;
      else {
        index1 += 'aria-label="'.length;
        index2 = contentHtml.indexOf('">', index1);
        entry['duration'] = contentHtml.substring(index1, index2);
        var firstChar = entry['duration'].charAt(0);
        if( firstChar < '0' || firstChar > '9') {
          entry['duration'] = '0 minutes';
        }
        index1 = index2;
      }

      // get title
      last1 = index1;
      index1 = contentHtml.indexOf('aria-label="', index1);
      if (index1 == -1) index1 = last1;
      else {
        index1 += 'aria-label="'.length;
        index2 = contentHtml.indexOf('">', index1);
        entry['title'] = contentHtml.substring(index1, index2);
        index1 = index2;
      }

      // get channel-link and channel-name
      last1 = index1;
      index1 = contentHtml.indexOf('<div id="container" class="style-scope ytd-channel-name">', index1);
      if (index1 == -1) index1 = last1;
      else {
        index1 += '<div id="container" class="style-scope ytd-channel-name">'.length;
        index1 = contentHtml.indexOf('href="', index1);
        index1 += 'href="'.length;
        index2 = contentHtml.indexOf('"', index1);
        entry['channel-link'] = PUP_URL_BASE + contentHtml.substring(index1, index2);
        index1 = index2;
        index1 = contentHtml.indexOf('dir="auto">', index1);
        index1 += 'dir="auto">'.length;
        index2 = contentHtml.indexOf('</a>', index1);
        entry['channel-name'] = contentHtml.substring(index1, index2);
        index1 = index2;
      }
      
      // get description
      last1 = index1;
      index1 = contentHtml.indexOf('<yt-formatted-string id="description-text" class="style-scope ytd-video-renderer">', index1);
      if (index1 == -1) index1 = last1;
      else {
        index1 += '<yt-formatted-string id="description-text" class="style-scope ytd-video-renderer">'.length;
        index2 = contentHtml.indexOf('</yt-formatted-string>', index1);
        entry['description'] = contentHtml.substring(index1, index2);
        index1 = index2;
      }

      //count += 1;
      //console.log(count);
      if (entry['title'] != undefined) {
        entry['watched-date'] = date_label;
        newdata['completed-courses'].push(entry);
      }
    }

    // TODO: adjust date-label
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var now = new Date();
    year = String(now.getFullYear());
    today = monthNames[now.getMonth()] + ', ' + String(now.getDate());
    for (i=0; i<newdata['completed-courses'].length; i++) {
      entry = newdata['completed-courses'][i];
      date_label = entry['watched-date'];
      if (date_label == 'Today') entry['watched-date'] = today;
      // if (date_label == 'Yesterday') entry['watched-date'] = yesterday;
      // if (date_label == 'Sunday') entry['watched-date'] = sunday;
      // if (date_label == 'Monday') entry['watched-date'] = monday;
      // if (date_label == 'Tuesday') entry['watched-date'] = tuesday;
      // if (date_label == 'Wednesday') entry['watched-date'] = wednesday;
      // if (date_label == 'Thursday') entry['watched-date'] = thursday;
      // if (date_label == 'Friday') entry['watched-date'] = friday;
      // if (date_label == 'Saturday') entry['watched-date'] = saturday;
      if (date_label == undefined) {
        console.log(date_label)
        console.log(entry)
        console.log(i)

      }
      if (!date_label.includes(',')) entry['watched-date'] = date_label + ', ' + year;

      // TODO: create entry['watched-ts'] for sorting
    }

    if (options.saveSampleData) {
      fs.writeFileSync(SAMPLE_FILE, JSON.stringify(newdata, null, 2));
    }

    if (options.gatherDetails) {
      var filteredPage = await base.browser_prep_filtered(browser);
      for (i=0; i<newdata['completed-courses'].length; i++) {
        if (!newdata['completed-courses'][i]['details']) {
          console.log(i);
          [temp1, temp2, temp3, temp4, temp5] = await process_course_details(filteredPage, options, newdata['completed-courses'][i]['link']);
          newdata['completed-courses'][i]['description']    = temp1;
          newdata['completed-courses'][i]['level']          = temp2;
          newdata['completed-courses'][i]['duration']       = temp3;
          newdata['completed-courses'][i]['prereqsuisites'] = temp4;
          newdata['completed-courses'][i]['type']           = temp5;
        }
      }
    }

    if (options.saveSampleData) {
      fs.writeFileSync(SAMPLE_FILE, JSON.stringify(newdata, null, 2));
    }
  }

   data['completed-courses'] = newdata['completed-courses'];
  console.log("process_completed done");
};



exports.process_course_details = process_course_details;
exports.process_completed = process_completed;
