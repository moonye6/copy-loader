var fs = require('fs'),
	path = require('path'),
	Q = require('q'),
	_ = require('lodash');

function HelloWorldPlugin(options) {
	// Setup the plugin instance with options...
	this.options = _.extend({}, options);
}

function fstat(p) {
	var deferred = Q.defer();
	fs.stat(p, function(err, stats) {
		if (err) {
			deferred.reject(err);
		}
		deferred.resolve(stats);
	});
	return deferred.promise;
}

function readdir(p) {
	var deferred = Q.defer();
	fs.readdir(p, function(err, list) {
		var ret = {
			list: [],
			retcode: 0
		};
		if (err) {
			ret.retcode = 1000;
			deferred.reject(ret);
		}
		ret.list = list;
		deferred.resolve(ret);
	});
	return deferred.promise;
}

function getFileList(context, p, ret, pre, deferred) {

	ret = ret || {
		retcode: 0,
		list: []
	};
	pre = pre ? (pre + path.sep) : '';
	deferred = deferred || Q.defer();

	readdir(p).then(function(dirdata) {
		if (dirdata.retcode === 0) {
			var count = 0;
			dirdata.list.forEach(function(file) {
				var p1 = path.resolve(context, p, file),
					f1 = fs.statSync(p1);
				if (f1.isFile()) {
					ret.list.push(pre + file);
					count++;
				} else {
					getFileList(context, p1, ret, pre + file, deferred);
				}

			})
			if (count === dirdata.list.length) {
				console.log(ret);
				deferred.resolve(ret);
			}
		} else {
			ret.retcode = 10000;
			deferred.reject(ret);
		}

	}, function(err) {
		console.log('read dir err ' + err);
	});
	return deferred.promise;
}

HelloWorldPlugin.prototype.apply = function(compiler) {
	// compiler.plugin('run', function(compiler) {
	// 	console.log('run');
	// });
	var self = this;

	compiler.plugin('compile', function(params) {
		console.log('compile');
	});
	compiler.plugin('make', function(compilation, callback) {
		console.log('make');
		callback(); //必须
	});
	compiler.plugin('done', function() {
		// console.log('Hello World!');
	});

	// Setup callback for accessing a compilation:
	compiler.plugin("compilation", function(compilation) {

		// Now setup callbacks for accessing compilation steps:
		compilation.plugin("optimize", function() {
			// console.log(compilation);
			// console.log("Assets are being optimized.");
		});
	});

	compiler.parser.plugin("f", function(expr) {
		// console.log("parse")
		// console.log(expr);
		return true;
	});
	compiler.plugin("emit", function(compilation, callback) {
		try {
			var publicPath = compilation.options.output.path,
				template = self.options.template,
				dirname = self.options.dirname;
			// console.log('mmm ' + template);
			// compilation.fileDependencies.push(template);

			template = path.resolve(compilation.compiler.context, template);

			getFileList(compilation.compiler.context, template).then(function(data) {
				data.list.forEach(function(item) {
					var p = path.resolve(compilation.compiler.context, template, item);
					compilation.assets[[dirname, item].join('')] = {
						source: function() {
							return fs.readFileSync(p);
						},
						size: function() {
							return fs.statSync(p).size;
						}
					};
				})
				callback();

			}, function(err) {
				console.log('get File list err ' + err);
			});

		} catch (e) {
			console.log(e)
		}

	});
};

module.exports = HelloWorldPlugin;