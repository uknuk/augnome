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
    showArtists();

    let [art, alb, num] = lib.loadLast();
    player.init(view);
    mainloop.timeout_add(1000, function() {
      player.updatePosition();
      return true;
    });

    if (num) {
      st.selArt = art;
      addAlbums();
      let aNum = st.selAlbs.indexOf(alb);
      selectAlbum(aNum, parseInt(num));
    }
  }

  function onStartup() {
    view = require('./view.js').View(app);
    view.search.entry.on("search-changed", () => {
      showArtists(view.search.entry.getText());
    });

    view.win.on('key_press_event', (widget, event) => {
      let key = Gdk.keyvalName(event.getKeyval()[1]);
      switch(key) {
      case 'Left':
        view.switchTo('player')
        break;
      case 'Right':
        view.switchTo('arts')
        showArtists();
        break;
      case 'Down':
        player.volume(-1);
        break;
      case 'Up':
        player.volume(1);
        break
      case 'space':
        player.changeState();
        break;
      case  'escape':
        view.switchTo('player')
      default:
        view.switchTo('arts');
        return false;
      }
      return true;
    });
  }

  function selectAlbum(aNum, tNum) {
    st.aNum = aNum;
    st.art = st.selArt;
    st.albs = st.selAlbs;
    // set font from length
    view.writeLabel('art', st.art);
    st.alb = st.albs[st.aNum];
    view.writeLabel('alb', lib.base(st.alb));
    player.loadAlbum(path.join(st.arts[st.art], st.alb));
    addTracks();
    player.playTrack(tNum);
  }


  function showArtists(entry = null) {
    let arts = Object.keys(st.arts)
    if (entry) {
      // entry = entry.replace('-','_');
      arts = arts.filter(
        art => art.replace('_','-').toLowerCase().startsWith(entry)
      );

      if (arts.length == 1) {
        st.selArt = arts[0];
        addAlbums();
        view.switchTo('player');
        return
      }
    }
    view.buffer.setText(arts.sort().map(a => lib.short(a)).join(" | "), -1);
    view.win.showAll();
  }

  function addTracks() {
    for (let child of view.panes.tracks.getChildren())
      child.destroy();

    let n = 0;
    for (let track of player.getTracks()) {
      let btn = view.setButton('tracks', lib.shortBase(track, 25), n);
      btn.on("clicked", player.playTrack.bind(null, n));
      n++;
      view.panes.tracks.add(btn);
    }
    view.win.showAll();
  }

  function addAlbums() {
    st.selAlbs = lib.loadAlbums(st.arts[st.selArt]);
    for (let child of view.panes.albs.getChildren())
      child.destroy();

    let n = 0;
    for (let alb of st.selAlbs) {
      let btn = view.setButton('albs', lib.shortBase(alb), n);
      btn.on("clicked", selectAlbum.bind(null, n, 0));
      n++;
      view.panes.albs.add(btn);
    }

    view.win.showAll();
  }

  function save(tNum, track) {
    lib.save([st.art, st.alb, tNum, track])
  }

  return {run, save}
}

require('GLib').setPrgname('Audio Gnome');
let app = App();
let player = require('./player.js').Player(app)
app.run(player);
