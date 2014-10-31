var request = require('request'),
    async = require('async'),
    path = require('path'),
    fs = require('fs'),
    apiKey = 'fFOf0EWU69UfHfprKtJnhAMZYEH2waE3FZPbtez6zfH9BjmosF',
    blogUrl = process.argv[2],
    limit = parseInt(process.argv[3]) || 1,
    url = 'http://api.tumblr.com/v2/blog/' + blogUrl + '/posts/photo?api_key=' + apiKey + '&reblog_info=true';

try {
    fs.mkdirSync(__dirname + '/img/');
    fs.mkdirSync(__dirname + '/img/' + blogUrl + '/');
} catch (e) {}

function iteratePages(err, res) {
    var totalPages = res[0];
    var start = new Date();
    var allPages = [];
    var countOC = 0;

    function generatePageRequest(count) {
        return function(cb) {
            var offset = count * 20;
            request(url + '&offset=' + offset, handlePage(count, totalPages, cb));
        }
    }

    for (var i = 0; i < totalPages; i++) {
        allPages.push( generatePageRequest(i) );
    }

    async.parallelLimit(allPages, limit, function(err, results) {
        if (err)
            throw err;

        console.log('Scarp done.');
        console.log('Started: ' + start);
        console.log('Ended: ' + new Date());
        console.log('OC count: %d, out of %d', countOC, totalPages);
    });
}

function getTotalposts(cb) {
    request(url, function (error, response, body) {
        var json = JSON.parse(body).response;

        cb(null, Math.round(json.total_posts / 20) + 1);
    });
}

function handlePage(page, totalPage, cb) {
    return function(error, response, body) {

        if (!error && response.statusCode == 200) {
            var blog = JSON.parse(body);

            async.mapSeries(blog.response.posts, function(post, cb) {

                if (post.reblogged_from_id) {
                    console.log('not oc');
                    return cb(null);
                }

                post.photos.forEach(function(photo) {
                    request(photo.original_size.url, function() {
                        countOC++;
                        console.log('Done loading ' + path.basename(photo.original_size.url));

                        cb(null);
                    }).pipe(fs.createWriteStream(__dirname + '/img/' + blogUrl + '/' + path.basename(photo.original_size.url)));
                });
            }, function() {
                console.log('Done page %d/%d', page, totalPage);
                cb(null);
            });
        }
    };
}

// main program
async.parallel([getTotalposts], iteratePages);
