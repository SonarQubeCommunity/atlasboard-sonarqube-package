const assert = require('assert');
const util = require('util');
const jsdom = require('jsdom');
const fs = require('fs');

describe('qg-filter', function() {

  require('../qg-filter.js');
  var widgetJS = widget;
  const widgetHtml = 'widgets/qg-filter/qg-filter.html';

  // initialization
  var prepareEnv = new Promise(function(resolve, reject) {
    fs.readFile(widgetHtml, (err, dataBuffer) => {
      if (err) {
        reject(err)
      } else {
        resolve(dataBuffer.toString());
      }
    });
  }).then(function(html) {
    const { window } = new jsdom.JSDOM(html);
    global.$ = require('jquery')(window);
    return Promise.resolve(window);
  });

  it('should show 2 projects and 3 measures', function() {

    return (
      prepareEnv.then(function(window) {
        const root = window.document.documentElement;

        widgetJS.onData(root, {
          title: 'rainy day',
          projects: [{
              name: 'The Cursed Child',
              metricsError: [{
                count: 1,
                metric: 'enemies'
              }, {
                count: 2,
                metric: 'friends to liberate'
              }]
            },
            {
              name: 'The Prisoner of Azkaban',
              metricsError: [{
                count: 1,
                metric: 'world to save'
              }]
            }
          ]
        });

        assert.strictEqual($($('.countRed', root).contents()[0]).text(), '2');
        assert.strictEqual($('.countRed .title', root).html(), 'rainy day');
        assert.strictEqual($('.content .status', root).length, 2);
        assert.strictEqual($('.content .status:eq(0) .statusName', root).html(), 'The Cursed Child');
        assert.strictEqual($('.content .countRedSmall:eq(0) .metric', root).html(), 'enemies');
        assert.strictEqual($($('.content .countRedSmall:eq(0)', root).contents()[0]).text(), '1');
        assert.strictEqual($('.content .countRedSmall:eq(1) .metric', root).html(), 'friends to liberate');
        assert.strictEqual($($('.content .countRedSmall:eq(1)', root).contents()[0]).text(), '2');
        assert.strictEqual($('.content .status:eq(1) .statusName', root).html(), 'The Prisoner of Azkaban');
        assert.strictEqual($('.content .countRedSmall:eq(2) .metric', root).html(), 'world to save');
        assert.strictEqual($($('.content .countRedSmall:eq(2)', root).contents()[0]).text(), '1');
      })
    );

  });

  it('should be green zero with the title', function() {
    return (
      prepareEnv.then(function(window) {
        const root = window.document.documentElement;

        widgetJS.onData(root, {
          title: 'sunny day',
          projects: []
        });

        assert.strictEqual($($('.countGreen', root).contents()[0]).text(), '0');
        assert.strictEqual($('.countGreen .title', root).html(), 'sunny day');
        assert.strictEqual($('.content .status', root).length, 0);
      })
    );
  });
});
