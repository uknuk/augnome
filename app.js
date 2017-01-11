const Gtk = require('Gtk'),
      Gdk = require('Gdk'),
      mainloop = imports.mainloop,
      path = require('path'),
      lib = require('./lib');


class App {
  constructor() {
    require('GLib').setPrgname('Audio Gnome');
  }

  run() {
    this.app = new Gtk.Application();
    this.app.on('activate', this.onActivate.bind(this));
    this.app.on('startup', this.onStartup.bind(this));
    this.app.on('destroy', Gtk.mainQuit);
    this.app.run([]);
  }

  onActivate() {
    this.arts = lib.loadArts();

    for (let art in this.arts) {
      var btn = new Gtk.Button({label: art});
      btn.on("clicked", this.selectArtist.bind(null, art))
      this.view.frames.arts.insert(btn, -1);
    }
    this.view.frames.arts.on('activate', () => print('activated'));

    let [art, alb, num] = lib.loadLast();

    this.player = require('./player.js').Player()
    this.player.init(this);
    mainloop.timeout_add(1000, (function() {
      if (this.player.isPlaying())
        this.player.updatePosition();
      return true;
    }).bind(this));

    if (num) {
      this.selArt = art;
      this.albs = lib.loadAlbums(this.arts[art]);
      this.selectAlbum(alb, num);

      for (let alb of this.albs) {
        let btn = new Gtk.Button({label: lib.cut(alb, 40)});
        btn.on("clicked", this.selectAlbum.bind(this, alb, 0));
        this.view.panes.albs.insert(btn, -1);
      }

      this.addTracks();
    }
    this.view.win.showAll();
  }

  onStartup() {
    this.view = require('./view.js').View(this.app);
    this.view.win.on('key_press_event', this.onKey.bind(this));
  }

  onKey(widget, event) {
    var key = Gdk.keyvalName(event.getKeyval()[1]);
    print(key);
    switch(key) {
    case 'Left':
      this.view.stack.setVisibleChildName('player');
      break;
    case 'Right':
      this.view.stack.setVisibleChildName('arts');
      break;
    case 'Down':
      this.player.volume(-0.1);
      break;
    case 'Up':
      this.player.volume(0.1);
      break
    case 'space':
      this.player.changeState();
      break;
    }
    return true;
  }

  selectArtist(art) {
    print(art);
  }

  selectAlbum(alb) {
    this.alb = alb;
    this.art = this.selArt;
    this.view.labels.art.label = this.art;
    this.view.labels.alb.label = this.alb;
    this.player.playAlbum(path.join(this.arts[this.art], this.alb), 0);
    this.addTracks();
  }

  addTracks() {
    for (let child of this.view.panes.tracks.getChildren())
      child.destroy()

    let n = 0;
    for (let track of this.player.getTracks()) {
      let btn = new Gtk.Button({label: lib.cut(path.basename(track), 25)});
      btn.on("clicked", this.selectTrack.bind(this, n++));
      this.view.panes.tracks.insert(btn, -1);
    }
    this.view.win.showAll();
  }

  save(tNum) {
    lib.save([this.art, this.alb, tNum])
  }

  selectTrack(n) {
    // change color
    this.player.playTrack(n);
  }

}

let app = new App();
app.run();
