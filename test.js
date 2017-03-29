var async = require("async");
var request = require("request");
var fs = require("fs");

require('draftlog').into(console)

var q = async.queue(function(part, cb)
{
  var update = console.draft(part.file + ": starting");
  var finished = true;
  
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
			  update(part.file + ": error, retrying in 18 seconds ");
			setTimeout(downloadPart, 18000);
		  }
		  else
		  {
			  setTimeout(cb, 9000);
		  } 
	  })
	  .pipe(fs.createWriteStream("parts/" + part.file));
}
  
  downloadPart();
}, 10);

q.drain = function()
{
  console.log('Done.')
};

(function()
{
	var startindex = 149079665;
	var limit = 600;
	
	for(var i = 0; i < limit; ++i)
	{
		var url = "https://livestream-f.akamaihd.net/i/14968495_4949630_lsicm7i5lw1qes77kdg_1@414355/segment" + (startindex + i) + "_2128_av-p.ts?sd=10&dw=14400&rebase=on&hdntl=exp=1490885391~acl=/i/14968495_4949630_lsicm7i5lw1qes77kdg_1@414355/*~data=hdntl~hmac=3e0181af5d31acae04fb252983f395d31679f1502d5556805be47a8692ee73a6";
		
		var file = url.match(/(segment.+?\.ts)/)[0];
		
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
		}  
})();