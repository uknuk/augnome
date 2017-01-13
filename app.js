const Gtk = require('Gtk'),
      Gdk = require('Gdk'),
      mainloop = imports.mainloop,
      path = require('path'),
      lib = require('./lib');


const App = function() {
  let player = null,
      app = null,
      st = {},
      view = null;



  function run(thePlayer) {
    player = thePlayer
    app = new Gtk.Application();
    app.on('activate', onActivate);
    app.on('startup', onStartup);
    app.on('destroy', onDestroy);
    app.run([]);
  }

  function onDestroy() {
    player.stop();
    Gtk.mainQuit();
  }

  function onActivate() {
    st.arts = lib.loadArtists();

    for (let art in st.arts) {
      let lbl = new Gtk.Label()
      lbl.setMarkup(`<span color='blue' font='8'>${lib.cut(art,25)}</span>`)
      let btn = new Gtk.Button();
      btn.add(lbl);
      btn.on("clicked", selectArtist.bind(null, art));
      view.frames.arts.add(btn);
    }
    view.frames.arts.on('activate', () => print('activated'));

    let [art, alb, num] = lib.loadLast();

    player.init(view);
    mainloop.timeout_add(1000, function() {
      if (player.isPlaying())
        player.updatePosition();
      return true;
    });

    if (num) {
      st.selArt = art;
      addAlbums(art);
      selectAlbum(alb, num);
    }
  }

  function onStartup() {
    view = require('./view.js').View(app);
    view.win.on('key_press_event', onKey);
  }

  function onKey(widget, event) {
    var key = Gdk.keyvalName(event.getKeyval()[1]);
    print(key);
    switch(key) {
    case 'Left':
      view.stack.setVisibleChildName('player');
      break;
    case 'Right':
      view.stack.setVisibleChildName('arts');
      break;
    case 'Down':
      player.volume(-0.1);
      break;
    case 'Up':
      player.volume(0.1);
      break
    case 'space':
      player.changeState();
      break;
    }
    return true;
  }

  function selectArtist(art) {
    st.selArt = art;
    addAlbums(art);
    view.stack.setVisibleChildName('player');
  }

  function selectAlbum(alb, tNum) {
    st.alb = alb;
    st.art = st.selArt;
    st.albs = st.selAlbs;
    write('art', 'blue', 24, st.art);
    write('alb', 'green', 24, st.alb);
    player.playAlbum(path.join(st.arts[st.art], st.alb), tNum);
    addTracks();
  }

  const write = (lbl, color, sz, txt) =>
        view.labels[lbl].setMarkup(`<span color='${color}' font='${sz}'>${txt}</span>`);

  function writeTrack(track) {
    write('track', 'blue', 24, track);
  }

  function addTracks() {
    for (let child of view.panes.tracks.getChildren())
      child.destroy();

    let n = 0;
    for (let track of player.getTracks()) {
      let btn = new Gtk.Button({label: lib.cut(path.basename(track), 25)});
      btn.on("clicked", selectTrack.bind(null, n));
      n++;
      view.panes.tracks.insert(btn, -1);
    }
    view.win.showAll();
  }

  function addAlbums(art) {
    st.selAlbs = lib.loadAlbums(st.arts[art]);
    for (let child of view.panes.albs.getChildren())
      child.destroy();

    for (let alb of st.selAlbs) {
      let btn = new Gtk.Button({label: lib.cut(alb, 40)});
      btn.on("clicked", selectAlbum.bind(null, alb, 0));
      view.panes.albs.insert(btn, -1);
    }

    view.win.showAll();
  }


  function save(tNum) {
    lib.save([st.art, st.alb, tNum])
  }

  function selectTrack(n) {
    // change color
    player.playTrack(n);
  }


  return {run, save, writeTrack}
}

require('GLib').setPrgname('Audio Gnome');
let app = App();
let player = require('./player.js').Player(app)
app.run(player);
