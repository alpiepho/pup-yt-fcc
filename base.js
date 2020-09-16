fsUtils = require("nodejs-fs-utils");

puppeteerC = require("puppeteer");
puppeteerF = require("puppeteer-firefox");

screenshot_count = 0;

function random_int(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

const browser_init = async (options) => {
  //console.log('browser_init')
  if (options.useSampleData) {
    return null;
  }
  if (options.screenshot) {
    try {
      fsUtils.removeSync(options.screenshotDir);
    } catch (err) {}
    try {
      fsUtils.mkdirsSync(options.screenshotDir);  
    } catch (err) {}
  }

  if (options.browserType == "chrome") {
    const browser = await puppeteerC.launch({
      headless: options.headless,
      ignoreHTTPSErrors: true,
      defaultViewport: null,
      args: [
        "--ignore-certificate-errors",
        "--ignore-certificate-errors-spki-list"
      ]
    });
    return browser;
  }
  if (options.browserType == "firefox") {
    const browser = await puppeteerF.launch({
      headless: options.headless,
      ignoreHTTPSErrors: true,
      defaultViewport: null,
      args: [
        "--ignore-certificate-errors",
        "--ignore-certificate-errors-spki-list"
      ]
    });
    return browser;
  }

  return null;
};

const browser_get = async (browser, href, waitTime) => {
  let page;
  try {
    console.log("browser_get " + href);
    //const page = await browser.newPage();
    page = (await browser.pages())[0];
    await page.goto(href);
    await delay(waitTime);
  } catch (err) {}
  return page;
};

const blockedResources = [
//   'quantserve',
//   'adzerk',
//   'doubleclick',
//   'adition',
//   'exelator',
//   'sharethrough',
//   'twitter',
//   'google-analytics',
//   'fontawesome',
//   'facebook',
//   'analytics',
//   'optimizely',
//   'clicktale',
//   'mixpanel',
//   'zedo',
//   'clicksor',
//   'tiqcdn',
//   'googlesyndication',
//   'demdex',

//   'bat.bing',
//   'media-exp1.licdn.com',
//   'linkedin.com/track',
//   'linkedin.com/li/track',
//   'files3.lynda.com',
//   'platform.linkedin.com',
//   'www.linkedin.com/learning-api/relatedContent',
//   'snap.licdn.com',
];

const browser_prep_filtered = async (browser) => {
  let page;
  try {
    //console.log("browser_prep_filtered");
    //const page = await browser.newPage();
    page = (await browser.pages())[0];

    //TODO: try new page
    await page.setRequestInterception(false);
    page.removeAllListeners('request');
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      try {
        // BLOCK CERTAIN DOMAINS
        //console.log(request.url())
        if (blockedResources.some(resource => request.url().indexOf(resource) !== -1)) {
          //console.log("block");
          try {request.abort();} catch (err) { console.log("ABORT: " + err); }
        // ALLOW OTHER REQUESTS
        } else {
          //console.log("allow");
          //request.continue().catch(err => console.log(err));
          if (!request._interceptionHandled)
            try {request.continue();} catch (err) { console.log("CONTINUE: " + err); }
        }
      } catch (err) {}
    });
  } catch (err) {}
  return page;
};

const browser_get_filtered = async (page, href, waitTime) => {
  try {
    console.log("browser_get_filtered " + href);
    await page.goto(href, options={timeout: 20000});
    await delay(waitTime);
  } catch (err) { 
    console.log("ERROR: browser_get_filtered:"); 
    console.log(href); 
    console.log(err); 
    page.reload();
    // try {
    //   await delay(10000);
    //   console.log("browser_get_filtered-retry " + href);
    //   await page.goto(href, options={timeout: 20000});
    //   await delay(10000);
    // } catch (err) { 
    //   console.log("ERROR: browser_get_filtered-retry:"); 
    //   console.log(href); 
    //   console.log(err); 
    //   page.reload();
    // }
  }
};

const browser_close = async browser => {
  //console.log('browser_close')
  if (options.useSampleData) {
    return null;
  }
  await browser.close();
};

const process_screenshot = async (browser, filename) => {
  //console.log('process_screenshot')
  const page = (await browser.pages())[0];
  await page.screenshot({ path: filename })
  //console.log('process_screenshot done')
};

const process_options = async (browser, options) => {
  //console.log('process_options')
  if (options.screenshot) {
    filename = options.screenshotDir + '/img' + screenshot_count + '.jpeg'
    await process_screenshot(browser, filename)
    screenshot_count += 1;
  }  
  //console.log('process_options done')
};

exports.random_int = random_int;
exports.delay = delay;
exports.browser_init = browser_init;
exports.browser_get = browser_get;
exports.browser_prep_filtered = browser_prep_filtered;
exports.browser_get_filtered = browser_get_filtered;
exports.browser_close = browser_close;
exports.process_options = process_options;
