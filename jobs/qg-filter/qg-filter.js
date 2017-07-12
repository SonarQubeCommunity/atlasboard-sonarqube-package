const util = require('util');

/**
 * Job: dory-filter
 *
 * Expected configuration:
 *
 * {
 *     "interval": 1800000,
 *     "supergreen" : "images/super_green.jpg",
 *     "team_manual_measure": 1,
 *     "days_since_last_commitMax": 30,
 *     "credentials": "dory",
 *     "widgetTitle": "Quality Gate Failures"
 * }
 */
module.exports = {

    onRun: function (config, dependencies, job_callback) {

        fetchListOfProjects(config, dependencies)
            .then(function (projects) {
                return fetchProjectsMeasures(config, dependencies, projects);
            })
            .then(decodeProjectsMeasures)
            .then(function (projects) {
                const millisecondsPerDay = 24 * 60 * 60 * 1000;
                const timeHorizon = Date.now() - config.days_since_last_commitMax * millisecondsPerDay;

                return filterProjectsInError(projects
                    , timeHorizon);
            })
            .then(function (projectsInError) {

                // prepare an array, by project
                const projectsQA = Object.keys(projectsInError)
                    .sort()
                    .map(function (projectName) {
                        return {
                            name: projectName
                            , metricsError: projectsInError[projectName]
                        };
                    });

                job_callback(null, {
                    title: config.widgetTitle
                    , projects: projectsQA
                });


            })
            .catch(function (err) {
                job_callback(err.message);
            });
    }
};

function computeRequestOptionsForSQ(config, path) {
    return {
        url: config.globalAuth[config.credentials].rootURL + path,
        headers: {
            'authorization': 'Basic ' + new Buffer(
                config.globalAuth[config.credentials].username
                + ':'
                + config.globalAuth[config.credentials].password
            ).toString('base64')
        }
        , timeout: config.interval * 3
        , rejectUnauthorized: false
    };
}

module.exports.fetchListOfProjects = fetchListOfProjects;
function fetchListOfProjects(config, dependencies) {
    return new Promise(
        function (resolve, reject) {
        	const filter = config.filterProjects ? util.format("&%s", config.filterProjects) : '';
        	const path = '/api/projects/index?format=json' + filter;
            const options = computeRequestOptionsForSQ(config, path);
            dependencies.request(options, function (err, response, body) {
                if (err) {
                	reject(err);
                } else if (!response) {
                    reject(new Error('Bad response'));
                } else if (response.statusCode !== 200) {
                    reject(new Error(util.format('Bad status %s', response.statusCode)));
                } else {
                    try {
                        const bodyObj = JSON.parse(body);
                        resolve(bodyObj);
                    } catch (ex) {
                        reject(ex)
                    }
                }
            });
        }
    );
}

/**
 * enrich the objects given by fetchListOfProjects with measures
 * @type {fetchProjectsMeasures}
 */
module.exports.fetchProjectsMeasures = fetchProjectsMeasures;
function fetchProjectsMeasures(config, dependencies, projects) {

    // synch with a promise and recursion
    // with recursion only 1 req at a time, dilluting the load on SonarQube
    return new Promise(
        function (resolve, reject) {

            queryOneProject(resolve, reject, 0);
        }
    );

    function queryOneProject(resolve, reject, projectIndex) {
        if (projectIndex < projects.length) {
            const path = util.format(
                '/api/measures/component?componentKey=%s' +
                '&metricKeys=quality_gate_details,alert_status,last_commit_date',
                projects[projectIndex].k);
            const options = computeRequestOptionsForSQ(config, path);
            dependencies.request(options, function (err, response, body) {
                    if (err) {
                        reject(err)
                    } else if (!response) {
                        reject(new Error('Bad response'));
                    } else if (response.statusCode !== 200) {
                        reject(new Error(util.format('Bad status %s', response.statusCode)));
                    } else {
                        try {
                            const bodyObj = JSON.parse(body);

                            // enrich existing project object
                            projects[projectIndex].measures = bodyObj.component.measures;

                            // recursion
                            queryOneProject(resolve, reject, projectIndex + 1);
                        } catch (ex) {
                            reject(ex);
                        }
                    }
                }
            );
        } else {
            resolve(projects);
        }
    }
}

module.exports.decodeProjectsMeasures = decodeProjectsMeasures;
function decodeProjectsMeasures(projects) {
    return new Promise(
        function (resolve, reject) {
            resolve(projects.map(function (projectObj) {

                var returned_project = {
                    key: projectObj.k
                    , name: projectObj.nm
                };

                // collect the values,
                projectObj.measures.forEach(function (projectMsr) {

                    const metricKey = projectMsr.metric;
                    var value;
                    switch (metricKey) {
                        case 'alert_status':
                            value = projectMsr.value;
                            break;
                        case 'quality_gate_details':
                            const data = JSON.parse(projectMsr.value);
                            // value is only the non OK measures
                            value = data.conditions.filter(function (condition) {
                                return condition.level !== 'OK';
                            });
                            break;
                        case 'last_commit_date':
                            value = parseInt(projectMsr.value, 10);
                            break;
                        default:
                            reject(new Error('Invalid measure key :' + metricKey));
                            break;
                    }

                    returned_project[metricKey] = value;
                });

                return returned_project;

            }));
        });
}


module.exports.filterProjectsInError = filterProjectsInError;

function filterProjectsInError(projects, timeHorizon) {

    return new Promise(function (resolve /*, reject*/) {

            // this will be returned
            var projectsInError = {};

            projects.forEach(function (project) {

                // only projet in ERROR
                if (project.alert_status === 'ERROR'
                    // for less then XX days
                    &&
                    ( ! timeHorizon || project.last_commit_date >= timeHorizon )
                ) {
                    // pick the measures in ERROR
                    projectsInError[project.name] = project.quality_gate_details.filter(function (oneMeasure) {
                        return oneMeasure.level === 'ERROR';
                    }).map(function (oneFaultyMeasure) {
                        return {
                            // multiply and divide by ten preserves from bad rounding
                            count: Math.round(oneFaultyMeasure.actual * 10.0) / 10.0
                            , metric: oneFaultyMeasure.metric
                        };

                    });
                }
            });

            resolve(projectsInError);
        }
    );
}
