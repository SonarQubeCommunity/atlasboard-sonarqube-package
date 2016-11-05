var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha');
var sonarqubeScanner = require('sonarqube-scanner');

gulp.task('default', ['test'], function (callback) {
    // We just run a SonarQube analysis and push it to SonarQube.com
    // ----------------------------------------------------
    sonarqubeScanner({
        serverUrl: process.env.SONARQUBE_URL,
        token: process.env.SONARQUBE_TOKEN,
        options: {
            "sonar.projectName" : "SonarQube package for Atlasboard",
            "sonar.sources" : "jobs, widgets",
            "sonar.tests" : "jobs, widgets",
            "sonar.test.inclusions" : "**/test/**",
            "sonar.javascript.jstest.reportsPath" : "coverage",
            "sonar.javascript.lcov.reportPath" : "coverage/lcov.info"
        }
    }, callback);
    // ----------------------------------------------------
});

gulp.task('test', ['pre-test'], function () {
  return gulp.src(['widgets/**/test/*.js', 'jobs/**/test/*.js'])
    .pipe(mocha())
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports());
});

gulp.task('pre-test', function () {
  return gulp.src(['widgets/**/*.js', 'jobs/**/*.js'])
    // Covering files
    .pipe(istanbul())
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
});
