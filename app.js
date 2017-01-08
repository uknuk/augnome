const Gtk = require('Gtk'),
      Gdk = require('Gdk'),
      mainloop = imports.mainloop,
      path = require('path'),
      player = require('./player'),
      lib = require('./lib');


class App {
  constructor() {
    this.title = 'Audio Gnome'
    require('GLib').setPrgname(this.title);
  }

  run() {
    this.app = new Gtk.Application();
    this.app.on('activate', this.onActivate.bind(this));
    this.app.on('startup', this.onStartup.bind(this));

    this.app.run([]);
  }

  onActivate() {
    this.win.show_all();
    this.arts = lib.loadArts();
    let [art, alb, num] = lib.loadLast();

    player.init();
    mainloop.timeout_add(1000, (function() {
      if (player.isPlaying()) {
        let [pos, dur] = player.readPosition();
        this.pLabel.label = `${pos} ${dur}`;
      }
      return true;
    }).bind(this));

    if (num) {
      this.art = this.selArt = art;
      let artPath = this.arts[art];
      player.albs = lib.loadAlbums(artPath);
      player.playAlbum(path.join(artPath, alb), parseInt(num));
    }
    //mainloop.run();
  }

  onStartup() {
    this.win = new Gtk.ApplicationWindow(
      { application: this.app,
        defaultHeight: 572,
        defaultWidth: 1024,
        windowPosition: Gtk.WindowPosition.CENTER
      });

    this.header = new Gtk.HeaderBar({title: "Audio Gnome Invisible"});
    this.header.setShowCloseButton(true);
    this.win.setTitlebar(this.header);

    this.pLabel = new Gtk.Label();
    this.tLabel = new Gtk.Label({label: 'Track'});

    this.stack = new Gtk.Stack()
    this.transition = {player: 'artists', artists: 'player'}
    this.stack.addTitled(this.pLabel, "player", "Player");
    this.stack.addTitled(this.tLabel, "artists", "Artists");

    this.switcher = new Gtk.StackSwitcher();
    this.switcher.setStack(this.stack);
    this.header.add(this.switcher);

    this.searchBar = new Gtk.SearchBar();
    this.searchBar.show();
    let searchEntry = new Gtk.SearchEntry();
    searchEntry.show();
    this.searchBar.connectEntry(searchEntry);
    this.searchBar.add(searchEntry);
    this.searchBar.setSearchMode(true);
    this.header.add(this.searchBar);

    this.win.add(this.stack);
    this.win.on('key_press_event', this.onKey.bind(this));
  }

  onKey(widget, event) {
    var key = Gdk.keyvalName(event.getKeyval()[1]);
    switch(key) {
    case 'less':
      player.changeState();
      break;
    case 'apostrophe':
    let newStack = this.transition[this.stack.getVisibleChildName()];
    this.stack.setVisibleChildName(newStack);
      break;
    }
  }

}


let app = new App();
app.run();
