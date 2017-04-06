var async = require("async");
var request = require("request");
var fs = require("fs");

require('draftlog').into(console)

var q = async.queue
(
	function(part, cb)
	{
	  var update = console.draft(part.file + ": starting");
	  var finished = true;
	  
	  function check()
	  {
		var now = Date.now();
		if(now/10000 > part.time)
		{
			setTimeout(downloadPart, 500);
		}
		else
		{
			update(part.file + ": too soon, retrying in 20 seconds ");
			setTimeout(check, 20000);
		}
	  }
	  
	  function downloadPart()
	  {		  
		request
		  .get(part.url)
		  .on('response', function(response)
		  {
			if(response.statusCode != 200)
			{
				finished = false;
			}
			else
			{
				finished = true;
				var len = parseInt(response.headers['content-length'], 10);
				var cur = 0;

				response.on("data", function(chunk)
				{
				  cur += chunk.length;
				  update(part.file + ": downloading " + (100.0 * cur / len).toFixed(2) + "%");
				});
			}
		  })
		  .on('error', function(err)
		  {
		  })
		  .on('end', function()
		  {
			  if(!finished)
			  {
				  update(part.file + ": error, retrying in 20 seconds ");
				setTimeout(downloadPart, 20000);
			  }
			  else
			  {
				  setTimeout(cb, 9000);
			  } 
		  })
		  .pipe(fs.createWriteStream("parts/" + part.file));
		}
		
		check();
	},
	2
);

q.drain = function()
{
  console.log('Done.')
};

(function()
{
	var startindex = 149148700;
	var limit = 600;
	
	for(var i = 0; i < limit; ++i)
	{
		var url = "https://livestream-f.akamaihd.net/i/14968495_4949630_lsi0nz1zo1nl87trbj4_1@305406/segment" + (startindex + i) + "_2128_av-p.ts?sd=10&dw=14400&rebase=on&hdntl=exp=1491573920~acl=/i/14968495_4949630_lsi0nz1zo1nl87trbj4_1@305406/*~data=hdntl~hmac=059c4a67db5b3a4ba1d0bc5d59dcc555dd7e58f0373db6cd0a6c6e1462ca72ef";
		
		var file = url.match(/(segment.+?\.ts)/)[0];
		
		q.push
		  (
			{
			  url: url,
			  file: file,
			  time: (startindex + i)
			},
			function(err)
			{
			  if (err) {
				console.log(err);
			  }
			});
		}  
})();