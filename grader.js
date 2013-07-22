#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var sleep = require('sleep');
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
//var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URLINFO_DEFAULT = "";
var TMP_FILE = "./tmp.html"
var sys = require('util'),
    rest = require('restler');
var url = "";
var output = "";
var r = null;

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

writeTmpFile = function(file, result){
  //console.log(result);
  return fs.writeFileSync(file, result);
};

var getURLInfo = function(url, temp_file) {
  rest.get(url).on('complete', function(result,response) {    
    if (result instanceof Error) {
      console.error('Error: ' + sys.format(result.message));
      sys.puts('Error: ' + result.message);
      this.retry(5000); // try again after 5 sec
    } else {
      writeTmpFile(temp_file, result);
    }
  });
  return 1;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html') //, HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'url direction') //, URLINFO_DEFAULT)
        .parse(process.argv);


    if (typeof program.url == 'undefined' && typeof program.file == 'undefined') {
        //console.log("file " + program.file);
        console.log("Missing arguments. Exiting.");
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }

    if (typeof program.file != 'undefined') {
        htmlFile = program.file;
        console.log("cacaca" + program.file);
        //var checkJson = checkHtmlFile(program.file, program.checks);
    }
    if (typeof program.url != 'undefined') {
        
        getURLInfo(program.url,TMP_FILE);
        htmlFile = TMP_FILE;
        //console.log(getURLInfo(program.url));
        //console.log("urlFile: " + urlFile);
        
        //var checkJson = checkHtmlFile(TMP_FILE, program.checks);
    }
    var checkJson = checkHtmlFile(htmlFile, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}