var gulp = require('gulp');
var sonarqubeScanner = require('sonarqube-scanner');

gulp.task('default', function (callback) {
    // We just run a SonarQube analysis and push it to SonarQube.com
    // ----------------------------------------------------
    sonarqubeScanner({
        serverUrl: process.env.SONARQUBE_URL,
        token: process.env.SONARQUBE_TOKEN,
        options: {
            "sonar.projectName" : "SonarQube package for Atlasboard",
            "sonar.tests" : "jobs, widgets",
            "sonar.test.inclusions" : "**/test/**",
            "sonar.javascript.jstest.reportsPath" : "reports",
            "sonar.javascript.lcov.reportPath" : "reports/lcov.info"
        }
    }, callback);
    // ----------------------------------------------------
});
