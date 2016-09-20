widget = {

    onData: function (el, data) {

        const countCSS = data.projects.length === 0 ? 'countGreen' : 'countRed';

        $('.count', el).html(`<div class='${countCSS}'>${data.projects.length}<div class='title'>${data.title}</div></div>`);

        $('.content', el).html('');
        data.projects.forEach(function (project) {
            var name = project.name;
            var html = '<div class=\'status\'><div class=\'statusName\'>' + name + '</div></div>';
            $('.content', el).append(html);
            var index;
            for (index = 0; index < project.metricsError.length; index++) {
                html = '<div class=\'countRedSmall\'>' + project.metricsError[index].count
                    + '<div class=\'metric\'>' + project.metricsError[index].metric
                    + '</div></div>';
                $('.content', el).append(html);
            }
        });
    }
};
