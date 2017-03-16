var async = require("async");
var request = require("request");
var fs = require("fs");

require('draftlog').into(console)

var q = async.queue(function(part, cb)
{
  var update = console.draft(part.file + ": starting");

  request
  .get(part.url)
  .on('response', function(response)
  {
    var len = parseInt(response.headers['content-length'], 10);
    var cur = 0;

    response.on("data", function(chunk)
    {
      cur += chunk.length;
      update(part.file + ": downloading " + (100.0 * cur / len).toFixed(2) + "%");
    });
  })
  .on('error', function(err) {
    console.log(err);
    cb(err);
  })
  .on('end', function()
  {
    cb();
  })
  .pipe(fs.createWriteStream("parts/" + part.file));
}, 20);

q.drain = function()
{
  console.log('Done.')
};

var lineReader = require('readline').createInterface
({
  input: require('fs').createReadStream('list.txt')
});

lineReader.on('line', function (line)
{
  var url = line;
  var file = line.match(/(segment.+?\.ts)/)[0];

  q.push
  (
    {
      url: url,
      file: file
    },
    function(err)
    {
      if (err) {
        console.log(err);
      }
    });
});