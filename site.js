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
    var count = 0;
    var entry;
    var date_label = "";
    while (index1 != -1 && index1 < contentHtml.length) {
      entry = {};

      // find next thumb
      nextThumbIndex = contentHtml.indexOf('<a id="thumbnail"', index1);

      // possible date-label (will adjust 'Today', 'Yesterday', etc. later)
      last1 = index1;
      index1 = contentHtml.indexOf('<div id="title" class="style-scope ytd-item-section-header-renderer">', index1);
      if (index1 == -1) index1 = last1;
      else if (nextThumbIndex != -1 && nextThumbIndex < index1) index1 = last1; // date-label found is beyond next thumbnail
      else {
        index1 += '<div id="title" class="style-scope ytd-item-section-header-renderer">'.length;
        index2 = contentHtml.indexOf('</div>', index1);
        date_label = contentHtml.substring(index1, index2);
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

      count += 1;
      //console.log(count);
      if (entry['title'] != undefined) {
        entry['watched-date'] = date_label;
        newdata['completed-courses'].push(entry);
      }
    }

    // TODO: adjust date-label
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    //const dayNames = ["Sunday", "Monday", "Tuesday", "Wednedsay", "Thursday", "Friday", "Saturday"];
    var date;
    date = new Date();
    year = String(date.getFullYear());

    date = new Date();
    today = monthNames[date.getMonth()] + ' ' + String(date.getDate()) + ', ' + String(date.getFullYear());

    date = new Date();
    date.setDate(date.getDate() - 1)
    yesterday = monthNames[date.getMonth()] + ' ' + String(date.getDate()) + ', ' + String(date.getFullYear());

    sunday = "";
    monday = "";
    tuesday = "";
    wednesday = "";
    thursday = "";
    friday = "";
    saturday = "";
    for (i=2; i<9; i++) {
      date = new Date();
      date.setDate(date.getDate() - i);
      dateStr = monthNames[date.getMonth()] + ' ' + String(date.getDate()) + ', ' + String(date.getFullYear());
      switch (date.getDay()) {
        case 0: sunday = dateStr; break;
        case 1: monday = dateStr; break;
        case 2: tuesday = dateStr; break;
        case 3: wednesday = dateStr; break;
        case 4: thursday = dateStr; break;
        case 5: friday = dateStr; break;
        case 6: saturday = dateStr; break;
      }
    }

    for (i=0; i<newdata['completed-courses'].length; i++) {
      entry = newdata['completed-courses'][i];
      date_label = entry['watched-date'];
      if (date_label == 'Today') date_label = today;
      if (date_label == 'Yesterday') date_label = yesterday;
      if (date_label == 'Sunday') date_label = sunday;
      if (date_label == 'Monday') date_label = monday;
      if (date_label == 'Tuesday') date_label = tuesday;
      if (date_label == 'Wednesday') date_label = wednesday;
      if (date_label == 'Thursday') date_label = thursday;
      if (date_label == 'Friday') date_label = friday;
      if (date_label == 'Saturday') date_label = saturday;

      if (!date_label.includes(',')) date_label = date_label + ', ' + year;
      entry['watched-date'] = date_label;

      // create entry['watched-yyyymmdd'] for sorting
      parts = entry['watched-date'].replace(',', '').split(' ');
      yyyy = parts[2];
      mm = "0";
      for (j=0; j<monthNames.length; j++) {
        if (parts[0] == monthNames[j]) mm = String(j);
      }
      dd = parts[1];
      entry['watched-yyyymmdd'] = yyyy + mm.padStart(2, '0')+ dd.padStart(2, '0');

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
