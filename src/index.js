if (process.env.NODE_ENV != 'production') {
  require('dotenv').config();
}
var restify = require('restify');
var pgRestify = require('pg-restify');

var server = restify.createServer({
  name: 'pg-restify-monad',
  version: '0.0.1'
});

var port = process.env.PORT || 5000;

// add any additional custom server configuration
var url = require('url');
var jwtBasicAuth = function(req, res, next) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  if (query['access_token'] != process.env.ACCESS_TOKEN && process.env.SKIP_AUTH != 'true') {
    var err = new restify.errors.NotAuthorizedError('valid access_token is required!');
    return next(err);
  }
  return next();
};
server.use(jwtBasicAuth);
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/echo/:name', function(req, res, next) {
  res.send(req.params);
  return next();
});

// add the pgRestify functionality
// by providing the restify instance
// and a server connection string
var hooks = new pgRestify.Hooks();

function convertColumnToSnakeCaseField(data) {
  return data;
}

pgRestify.initialize({
  server: server,
  pgConfig: process.env.DATABASE_URL,
  tableIdColumns: {
    'schema_migrations': 'version'
  },
  hooks: hooks,
  convertColumnToField: convertColumnToSnakeCaseField
}, function(err, pgRestifyInstance) {

  // If there is an error initializing you will see it here.
  if (err) throw err;

  // now that the query to get table metadata is done,
  // start the server
  server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
  });

});