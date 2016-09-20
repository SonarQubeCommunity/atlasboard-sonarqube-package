const assert = require('assert');
const util = require('util');
const qgFilter = require("../qg-filter.js");

describe('qg-filter', function () {

  var config;
  var dependencies;

  beforeEach(function () {
    // mockup config
    config = {
      "interval": 10800000,
      "widgetTitle": "QG gate",
      "credentials": "sonarqube",
      "globalAuth": {
        'sonarqube': {
          rootURL: 'http://sonarqube.hogwarts.edu',
          username: 'harry.potter',
          password: 'magic'
        }
      }
    };
    // mockup logger and http request
    dependencies = {
      bodyResponses: [],
      // mockup
      logger: {
        log: function (text) {
        },
        error: function (text) {
        }
      },
      request: function (options, request_callback) {
        request_callback(0, { statusCode: 200 }, dependencies.bodyResponses.pop());
      }
    };
  });

  describe('fetchProjectsMeasures', function () {
    it('should throw on error on bad status', function () {

      dependencies.request = function (options, request_callback) {
        request_callback(0, { statusCode: 500 }, null);
      };

      return qgFilter.fetchProjectsMeasures(config, dependencies, [{ k: 'foo', nm: 'bar' }])
          .then(function fulfilled (result) {
            throw new Error('fetchProjectsMeasures was unexpectedly fulfilled. Result: ' + util.inspect(result));
          }, function rejected (error) {
            assert(error instanceof Error);
          })
    });

    it('should throw on error on bad JSON', function () {

      dependencies.request = function (options, request_callback) {
        request_callback(0, { statusCode: 500 }, null);
      };

      return qgFilter.fetchProjectsMeasures(config, dependencies, [{ k: 'foo', nm: 'bar' }])
          .then(function fulfilled (result) {
            throw new Error('fetchProjectsMeasures was unexpectedly fulfilled. Result: ' + util.inspect(result));
          }, function rejected (error) {
            assert(error instanceof Error);
          })
    });

  });

  describe('decodeProjectsMeasures', function () {
    it('should throw on unknown measure', function () {

      return qgFilter.decodeProjectsMeasures(
          [{ k: 'foo', nm: 'bar', measures: [{ metric: 'badmetric', value: 'notvalid' }] }])
          .then(function fulfilled (result) {
            throw new Error('decodeProjectsMeasures was unexpectedly fulfilled. Result: ' + util.inspect(result));
          }, function rejected (error) {
            assert(error instanceof Error);
            assert.strictEqual(error.message, 'Invalid measure key :badmetric');
          })
    });
  });


  describe('end to end', function () {

    beforeEach(function () {

      // org.sonarsource.scm.cvs:sonar-scm-cvs-plugin
      dependencies.bodyResponses.push(
          "{\n\n  \"paging\": {\n    \"pageIndex\": 1,\n    \"pageSize\": 100,\n    \"total\": 0\n  },\n  \"baseComponent\": {\n    \"id\": \"1d9c31e0-1ab6-4be5-bbda-e4c4b1592c1c\",\n    \"key\": \"org.sonarsource.scm.cvs:sonar-scm-cvs-plugin\",\n    \"name\": \"SonarQube :: Plugins :: SCM :: CVS\",\n    \"description\": \"CVS SCM Provider.\",\n    \"qualifier\": \"TRK\",\n    \"measures\": [\n     {\n        \"metric\": \"quality_gate_details\",\n        \"value\": \"{\\n  \\\"level\\\": \\\"ERROR\\\",\\n  \\\"conditions\\\": [\\n    {\\n      \\\"metric\\\": \\\"new_sqale_debt_ratio\\\",\\n      \\\"op\\\": \\\"GT\\\",\\n      \\\"period\\\": 1,\\n      \\\"warning\\\": \\\"\\\",\\n      \\\"error\\\": \\\"5\\\",\\n      \\\"actual\\\": \\\"0.0\\\",\\n      \\\"level\\\": \\\"OK\\\"\\n    },\\n    {\\n      \\\"metric\\\": \\\"reopened_issues\\\",\\n      \\\"op\\\": \\\"GT\\\",\\n      \\\"period\\\": 1,\\n      \\\"warning\\\": \\\"0\\\",\\n      \\\"error\\\": \\\"\\\",\\n      \\\"actual\\\": \\\"0\\\",\\n      \\\"level\\\": \\\"OK\\\"\\n    },\\n    {\\n      \\\"metric\\\": \\\"open_issues\\\",\\n      \\\"op\\\": \\\"GT\\\",\\n      \\\"period\\\": 1,\\n      \\\"warning\\\": \\\"0\\\",\\n      \\\"error\\\": \\\"\\\",\\n      \\\"actual\\\": \\\"9\\\",\\n      \\\"level\\\": \\\"WARN\\\"\\n    },\\n    {\\n      \\\"metric\\\": \\\"skipped_tests\\\",\\n      \\\"op\\\": \\\"GT\\\",\\n      \\\"period\\\": 1,\\n      \\\"warning\\\": \\\"0\\\",\\n      \\\"error\\\": \\\"\\\",\\n      \\\"actual\\\": \\\"0\\\",\\n      \\\"level\\\": \\\"OK\\\"\\n    },\\n    {\\n      \\\"metric\\\": \\\"new_bugs\\\",\\n      \\\"op\\\": \\\"GT\\\",\\n      \\\"period\\\": 1,\\n      \\\"warning\\\": \\\"\\\",\\n      \\\"error\\\": \\\"1\\\",\\n      \\\"actual\\\": \\\"1\\\",\\n      \\\"level\\\": \\\"ERROR\\\"\\n    },\\n    {\\n      \\\"metric\\\": \\\"new_vulnerabilities\\\",\\n      \\\"op\\\": \\\"GT\\\",\\n      \\\"period\\\": 1,\\n      \\\"warning\\\": \\\"\\\",\\n      \\\"error\\\": \\\"0\\\",\\n      \\\"actual\\\": \\\"0\\\",\\n      \\\"level\\\": \\\"OK\\\"\\n    }\\n  ]\\n}\"\n      },\n      {\n        \"metric\": \"last_commit_date\",\n        \"value\": \"1464600985000\",\n        \"comment\": \"2016-05-30T09:36:25Z\"\n      },\n      {\n        \"metric\": \"alert_status\",\n        \"value\": \"ERROR\"\n      }\n    ]\n  },\n  \"components\": [ ]\n\n}"
      );
      //sonar-packaging-maven-plugin
      dependencies.bodyResponses.push(
          util.format(
              "{\n\n  \"paging\": {\n    \"pageIndex\": 1,\n    \"pageSize\": 100,\n    \"total\": 0\n  },\n  \"baseComponent\": {\n    \"id\": \"AVBLzFBb5VDW_Ub0IDJv\",\n    \"key\": \"org.sonarsource.sonar-packaging-maven-plugin:sonar-packaging-maven-plugin\",\n    \"name\": \"SonarQube :: Packaging Maven Plugin\",\n    \"description\": \"Parent pom of SonarSource public projects\",\n    \"qualifier\": \"TRK\",\n    \"measures\": [\n      {\n        \"metric\": \"last_commit_date\",\n        \"value\": \"%s\"      },\n      {\n        \"metric\": \"quality_gate_details\",\n        \"value\": \"{\\\"level\\\":\\\"ERROR\\\",\\\"conditions\\\":[{\\\"metric\\\":\\\"new_coverage\\\",\\\"op\\\":\\\"LT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"\\\",\\\"error\\\":\\\"85\\\",\\\"actual\\\":\\\"0.0\\\",\\\"level\\\":\\\"ERROR\\\"},{\\\"metric\\\":\\\"new_sqale_debt_ratio\\\",\\\"op\\\":\\\"GT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"\\\",\\\"error\\\":\\\"5\\\",\\\"actual\\\":\\\"2.380952380952381\\\",\\\"level\\\":\\\"OK\\\"},{\\\"metric\\\":\\\"reopened_issues\\\",\\\"op\\\":\\\"GT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"0\\\",\\\"error\\\":\\\"\\\",\\\"actual\\\":\\\"0\\\",\\\"level\\\":\\\"OK\\\"},{\\\"metric\\\":\\\"open_issues\\\",\\\"op\\\":\\\"GT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"0\\\",\\\"error\\\":\\\"\\\",\\\"actual\\\":\\\"0\\\",\\\"level\\\":\\\"OK\\\"},{\\\"metric\\\":\\\"skipped_tests\\\",\\\"op\\\":\\\"GT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"0\\\",\\\"error\\\":\\\"\\\",\\\"actual\\\":\\\"0\\\",\\\"level\\\":\\\"OK\\\"},{\\\"metric\\\":\\\"new_bugs\\\",\\\"op\\\":\\\"GT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"\\\",\\\"error\\\":\\\"0\\\",\\\"actual\\\":\\\"0\\\",\\\"level\\\":\\\"OK\\\"},{\\\"metric\\\":\\\"new_vulnerabilities\\\",\\\"op\\\":\\\"GT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"\\\",\\\"error\\\":\\\"0\\\",\\\"actual\\\":\\\"0\\\",\\\"level\\\":\\\"OK\\\"}]}\"\n      },\n            {\n        \"metric\": \"alert_status\",\n        \"value\": \"ERROR\"\n      }\n    ]\n  },\n  \"components\": [ ]\n\n}",
              Date.now() - 30 * 1000 // 30 seconds ago
          )
      );
      //burgr
      dependencies.bodyResponses.push(
          "{\n\n \"paging\": {\n    \"pageIndex\": 1,\n    \"pageSize\": 100,\n    \"total\": 0\n  },\n  \"baseComponent\": {\n    \"id\": \"AVKtK8s7wW7gmwRPbaVy\",\n    \"key\": \"com.sonarsource.burgr:burgr\",\n    \"name\": \"burgr\",\n    \"description\": \"BUild Reports aGRegator\",\n    \"qualifier\": \"TRK\",\n    \"measures\": [\n      {\n        \"metric\": \"alert_status\",\n        \"value\": \"OK\"\n      },\n      {\n        \"metric\": \"last_commit_date\",\n        \"value\": \"1467382075000\"\n      },\n      {\n        \"metric\": \"quality_gate_details\",\n        \"value\": \"{\\\"level\\\":\\\"OK\\\",\\\"conditions\\\":[{\\\"metric\\\":\\\"new_coverage\\\",\\\"op\\\":\\\"LT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"\\\",\\\"error\\\":\\\"85\\\",\\\"actual\\\":\\\"\\\",\\\"level\\\":\\\"OK\\\"},{\\\"metric\\\":\\\"new_sqale_debt_ratio\\\",\\\"op\\\":\\\"GT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"\\\",\\\"error\\\":\\\"5\\\",\\\"actual\\\":\\\"0.0\\\",\\\"level\\\":\\\"OK\\\"},{\\\"metric\\\":\\\"reopened_issues\\\",\\\"op\\\":\\\"GT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"0\\\",\\\"error\\\":\\\"\\\",\\\"actual\\\":\\\"0\\\",\\\"level\\\":\\\"OK\\\"},{\\\"metric\\\":\\\"open_issues\\\",\\\"op\\\":\\\"GT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"0\\\",\\\"error\\\":\\\"\\\",\\\"actual\\\":\\\"0\\\",\\\"level\\\":\\\"OK\\\"},{\\\"metric\\\":\\\"skipped_tests\\\",\\\"op\\\":\\\"GT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"0\\\",\\\"error\\\":\\\"\\\",\\\"actual\\\":\\\"0\\\",\\\"level\\\":\\\"OK\\\"},{\\\"metric\\\":\\\"new_bugs\\\",\\\"op\\\":\\\"GT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"\\\",\\\"error\\\":\\\"0\\\",\\\"actual\\\":\\\"0\\\",\\\"level\\\":\\\"OK\\\"},{\\\"metric\\\":\\\"new_vulnerabilities\\\",\\\"op\\\":\\\"GT\\\",\\\"period\\\":1,\\\"warning\\\":\\\"\\\",\\\"error\\\":\\\"0\\\",\\\"actual\\\":\\\"0\\\",\\\"level\\\":\\\"OK\\\"}]}\"\n      }\n    ]\n  },\n  \"components\": [ ]\n\n}"
      );
      // list of projects
      dependencies.bodyResponses.push(
          "[\n  {\n    \"id\": \"75263\",\n    \"k\": \"com.sonarsource.burgr:burgr\",\n    \"nm\": \"burgr\",\n    \"sc\": \"PRJ\",\n    \"qu\": \"TRK\"\n  },\n  {\n    \"id\": \"65266\",\n    \"k\": \"org.sonarsource.sonar-packaging-maven-plugin:sonar-packaging-maven-plugin\",\n    \"nm\": \"SonarQube :: Packaging Maven Plugin\",\n    \"sc\": \"PRJ\",\n    \"qu\": \"TRK\"\n  },\n  {\n    \"id\": \"35363\",\n    \"k\": \"org.sonarsource.scm.cvs:sonar-scm-cvs-plugin\",\n    \"nm\": \"SonarQube :: Plugins :: SCM :: CVS\",\n    \"sc\": \"PRJ\",\n    \"qu\": \"TRK\"\n  }\n]"
      );

    });


    it('should report 1 failed QG', function (done) {

      qgFilter.onRun(config, dependencies, function job_callback (errMsg, data) {
        assert.strictEqual(errMsg, null);

        assert.strictEqual(data.title, config.widgetTitle);
        assert(Array.isArray(data.projects));
        assert.strictEqual(data.projects.length, 2);

        assert.strictEqual(data.projects[0].name, 'SonarQube :: Packaging Maven Plugin');
        assert(Array.isArray(data.projects[0].metricsError));
        assert.strictEqual(data.projects[0].metricsError.length, 1);
        assert.strictEqual(data.projects[0].metricsError[0].metric, 'new_coverage');
        assert.strictEqual(data.projects[0].metricsError[0].count, 0);

        assert.strictEqual(data.projects[1].name, 'SonarQube :: Plugins :: SCM :: CVS');
        assert(Array.isArray(data.projects[1].metricsError));
        assert.strictEqual(data.projects[1].metricsError.length, 1);
        assert.strictEqual(data.projects[1].metricsError[0].metric, 'new_bugs');
        assert.strictEqual(data.projects[1].metricsError[0].count, 1);


        done();
      });
    });


    it('should report one project since the time horizon', function (done) {

      config.days_since_last_commitMax = 5;

      qgFilter.onRun(config, dependencies, function job_callback (errMsg, data) {
        assert.strictEqual(errMsg, null);

        assert.strictEqual(data.title, config.widgetTitle);
        assert(Array.isArray(data.projects));
        assert.strictEqual(data.projects.length, 1);
        assert.strictEqual(data.projects[0].name, 'SonarQube :: Packaging Maven Plugin');

        done();
      });

    });

    it('should handle request error', function (done) {

      dependencies.request = function (options, request_callback) {
        request_callback(0, { statusCode: 500 }, null);
      };

      qgFilter.onRun(config, dependencies, function job_callback (errMsg, data) {

        assert.strictEqual(errMsg, 'Bad status 500');
        assert.strictEqual(typeof data, 'undefined');
        done();
      });
    });

    it('should handle bad data', function (done) {
      dependencies.bodyResponses = [{ "bad": "structure" }];
      qgFilter.onRun(config, dependencies, function job_callback (errMsg, data) {

        assert.strictEqual(typeof errMsg, 'string');
        assert.strictEqual(typeof data, 'undefined');
        done();
      });

    });
  });
});
