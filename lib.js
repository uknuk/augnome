const lib = exports,
      path = require('path'),
      fs = require('fs'),
      ext = /\.mp3$|\.mp4a$|\.mpc$|\.ogg$/,
      lastFile = path.join(process.env['HOME'],'.rlast'),
      // max(f[0] - (length - f[2])/f[3], f[1])
      font = {
        info: [24, 12, 20, 5],
        items: [20, 12, 100, 40],
        albs: [20, 12, 40, 10],
        tracks: [18, 10, 100, 40]
      };


lib.loadLast = function() {
  try {
    return fs.readFileSync(lastFile).toString().split(/\n/);
  }
  catch(e) {
    console.log("File .rlast not found");
    return [null, null, null];
  }
}

lib.loadArtists = function() {
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
  var issued = function(alb) {
    var re = /^\d{2}[\s+|_|-]/;
    if (alb.substr(0,2) == 'M0')
      return alb.replace('M0', '200');

    var year = alb.match(re);
    return year ? year[0].substr(0,2) < 30 ? '20' + alb : '19' + alb : alb;
  }

  return fs.readdirSync(art).sort((a, b) => {

    if (a.substr(0,2) == 'Op' && b.substr(0,2) == 'Op') {
      let re = /^\d{2,3}/,
          oa = a.replace(/^Op/,'').match(re),
          ob = b.replace(/^Op/,'').match(re);

      if (oa && ob)
        return oa -ob;
    }

    let re = /^\d{4}/,
        ia = issued(a),
        ib = issued(b),
        ya = ia.match(re),
        yb = ib.match(re);


    if (ya && yb)
      return ya - yb;

    return ia === ib ? 0 : ia > ib ? 1 : -1;
  });

};


lib.loadTracks = function(alb) {
  return fs.statSync(alb).isFile() ? [alb] : lib.loadAlbum(alb);
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

lib.cut = function(name, limit) {
  let words = name.split(/\s+|\_+|\-+/);
  let sizes = words.reduce(function(acc, w) {
    acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + w.length);
    return acc;
  }, [])
  return words.filter((w, n) => sizes[n] < limit).join(" ");
}

lib.save = function(data) {
  fs.writeFileSync(lastFile, data.join('\n'));
}

lib.base = name => path.basename(name, path.extname(name));

lib.shortBase = (name, limit = 40) => lib.cut(lib.base(name), limit);

lib.short = (name, limit = 20) => name.substring(0, lib.cut(name, limit).length)

lib.fontSize = function(length, type) {
  // print(`${type}: ${length}`);
  let f = font[type];
  return Math.max(f[0] - (length - f[2])/f[3], f[1]).toFixed(0);
}
