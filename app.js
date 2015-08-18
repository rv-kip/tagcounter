var express                 = require('express'),
    logger                  = require('./lib/logger'),
    request                 = require('request'),
    html                    = require("html"),
    cheerio                 = require('cheerio'),
    config                  = require('./config/config.js').config,
    package_json            = require('./package.json');

var app = express();
app.set('view engine', 'jade');
app.set('config', config);
app.set('package_json', package_json);
app.set('port', config.server.port || 8081);
app.set('hostname', config.server.hostname || '0.0.0.0');
app.use('/public', express.static('public'));

// Routes
app.get('*', function (req, res, next){ // Log all requests
    var app = req.app;
    var logline = ['method=' + req.method, 'path=' + req.path, 'ip=' + req.ip];
    logger.info(logline.join(' '));
    next();
});

app.get("/ping", handle_ping);
app.get("/", handle_index);

// Handlers
function handle_ping(req, res){
    var app = req.app;

    var ping_data = {
        "status"        : "OK",
        "name"          : app.get('package_json').name,
        "version"       : app.get('package_json').version,
        "pid"           : "_" + process.pid
    };
    res.status(200).send(ping_data);
}

function handle_index(req, res){
    var url = req.query.url || null;

    var jade_elements = {
        title       : "Tag Counter"
    };

    // ensure http://
    if (url && url.match(/^http/) === null) {
        url = 'http://' + url;
    } else {
        // show search form only
        return res.render('index', jade_elements);
    }

    logger.info('url', url);

    request.get(url, function (err, response, body){
        if (err) {
            var options = {
                error: err
            };
            return res.render('error', options);
            // return res.send("Error: " + err.message);
        }

        // DOM-ify
        var $ = cheerio.load(body),
            tagcount = {};

        $('*').each(function(index, element){
            logger.debug('index, tagname:', index, element.name);
            if (tagcount[element.name]) {
                tagcount[element.name] ++;
            } else {
                tagcount[element.name] = 1;
            }
        });
        // sort tagcount by count
        var tagcount_arr = [];
        for (var tag in tagcount) {
            tagcount_arr.push([tag, tagcount[tag]]);
        }
        tagcount_arr.sort(function(a, b){
            return b[1] - a[1];
        });

        // Pretty print format the source
        var ret_body = safe_tags(html.prettyPrint(body, {indent_size: 2}));

        var jade_elements = {
            title       : "Tag Counter",
            page_source : ret_body,
            summary     : tagcount_arr
        };

        return res.render('index', jade_elements);
    });
}

// utilities
function safe_tags(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
}

// Start server
var server = app.listen(app.get('port'), app.get('hostname'), function() {
    logger.info('Server listening on http://' + app.get('hostname') + ':' + app.get('port'));
});