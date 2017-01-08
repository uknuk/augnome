const lib = exports,
      path = require('path'),
      fs = require('fs'),
      ext = /\.mp3$|\.mp4a$|\.mpc$|\.ogg$/,
      lastFile = path.join(process.env['HOME'],'.rlast');


lib.loadLast = function() {
  try {
    return fs.readFileSync(lastFile).toString().split(/\n/);
  }
  catch(e) {
    console.log("File .rlast not found");
    return [null, null, null];
  }
}

lib.loadArts = function() {
  var buf = fs.readFileSync(path.join(process.env['HOME'],'.mhdirs')),
      roots = buf.toString().replace(/\n+/,'').split(/\s+/);

  return function() {
    var arts = {};
    // add only new keys
    roots.forEach(function(dir, n) {
      if (dir.length > 0)
        fs.readdirSync(dir).forEach(function(name) {
          arts[name] = path.join(dir, name)
        });
    });
    return arts;
  };
}();

lib.loadAlbums = function(art) {
  return fs.readdirSync(art).sort(function(alb) {
    var re = /^\d{2}[\s+|_|-]/;
    if (alb.substr(0,2) == 'M0')
      return alb.replace('M0', '200');

    var year = alb.match(re);
    if (year)
      return year[0].substr(0,2) < 30 ? '20' + alb : '19' + alb;
    // works until 2030

    return alb;
  });
};

lib.loadTracks = function(alb) {
  return fs.statSync(alb).isFile() ? [alb] : this.loadAlbum(alb);
}

lib.loadAlbum = function(alb) {
  var sel = [],
      files = fs.readdirSync(alb).map(f => path.join(alb, f));

  files.forEach(function(file) {
    if (fs.statSync(file).isFile()) {
      if (ext.test(file))
        sel.push(file);
    }
    else
      sel = sel.concat(lib.loadAlbum(file));
  });

  return sel;
}
