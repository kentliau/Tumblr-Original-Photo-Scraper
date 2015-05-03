var request = require('request');
var async = require('async');
var path = require('path');
var fs = require('fs');
var apiKey = 'fFOf0EWU69UfHfprKtJnhAMZYEH2waE3FZPbtez6zfH9BjmosF';
var blogUrl = process.argv[2];
var limit = parseInt(process.argv[3]) || 1;
var url = 'http://api.tumblr.com/v2/blog/' + blogUrl + '/posts/photo?api_key=' + apiKey + '&reblog_info=true';

if (!blogUrl) {
  throw new Error('Blog URL does not present.');
}

var matchCount = 0;

try {
    fs.mkdirSync(__dirname + '/img/');
    fs.mkdirSync(__dirname + '/img/' + blogUrl + '/');
} catch (e) {}

function getTotalPostCount(callback) {
  request(url, function (error, response, body) {
    if (error)
      throw error;
      
    var data = JSON.parse(body).response;

    callback(null, data.total_posts);
  });
}

function iteratePages(error, totalPostCount) {
  var pageCount = Math.ceil(totalPostCount / 20);
  var allPages = [];
  
  function generatePageRequest(count) {
    var offset = count * 20;
    return function(callback) {
      request(url + '&offset=' + offset, handlePage(count, pageCount, callback));
    };
  }

  for (var i = 0; i < pageCount; i++) {
    allPages.push( generatePageRequest(i) );
  }
  
  async.parallelLimit(allPages, limit, function(error) {
    if (error)
      throw error;

    console.log('Script done.');
    console.timeEnd('Running time');
    console.log('Origin photos: %d, out of %d posts.', matchCount, totalPostCount);
  });
}

function handlePage(page, pageCount, callback) {
  return function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var blog = JSON.parse(body);
      async.mapSeries(blog.response.posts, function(post, callback) {
        if (post.reblogged_from_id) {
          // not original post
          return callback(null);
        }
        post.photos.forEach(function(photo) {
          var fsPath = __dirname + '/img/' + blogUrl + '/';
          var photoName = path.basename(photo.original_size.url);
          var writer = fs.createWriteStream(fsPath + photoName);
          writer.on('finish', function() {
            matchCount++;
            console.log('Done loading ' + photoName);
            callback(null);
          });
          request(photo.original_size.url).pipe(writer);
        });
      }, function() {
        console.log('Done page %d/%d', page, pageCount);
        callback(null);
      });
    }
  };
}

// main
console.time('Running time');
getTotalPostCount(iteratePages);