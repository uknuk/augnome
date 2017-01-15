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
      if (player.isPlaying())
        player.updatePosition();
      return true;
    });

    if (num) {
      st.selArt = art;
      addAlbums();
      selectAlbum(alb, num);
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
        switchTo('player')
        break;
      case 'Right':
        switchTo('arts')
        showArtists();
        break;
      case 'Down':
        setVolume(-0.1);
        break;
      case 'Up':
        setVolume(0.1);
        break
      case 'space':
        player.changeState();
        break;
      case  'escape':
        switchTo('player')
      default:
        switchTo('arts');
        return false;
      }
      return true;
    });
  }

  function selectAlbum(alb, tNum) {
    st.alb = alb;
    st.art = st.selArt;
    st.albs = st.selAlbs;
    write(view.labels.art, st.art, 24, 'blue');
    write(view.labels.alb, lib.base(st.alb), 24, 'green');
    player.playAlbum(path.join(st.arts[st.art], st.alb), tNum);
    addTracks();
  }


  function writeTrack(track) {
    write(view.labels.track,  track, 24, 'blue');
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
      switchTo('player');
      return
    }
  }
  view.buffer.setText(arts.sort().map(a => lib.short(a)).join(" | "), -1);
}

  function addTracks() {
    for (let child of view.panes.tracks.getChildren())
      child.destroy();

    let n = 0;
    for (let track of player.getTracks()) {
      let btn = setButton(lib.shortBase(track, 25), 16, 'blue');
      btn.on("clicked", selectTrack.bind(null, n));
      n++;
      view.panes.tracks.insert(btn, -1);
    }
    view.win.showAll();
  }

  function addAlbums() {
    st.selAlbs = lib.loadAlbums(st.arts[st.selArt]);
    for (let child of view.panes.albs.getChildren())
      child.destroy();

    for (let alb of st.selAlbs) {
      let btn = setButton(lib.shortBase(alb), 20, 'green');
      btn.on("clicked", selectAlbum.bind(null, alb, 0));
      view.panes.albs.add(btn);
    }

    view.win.showAll();
  }

  const write = (lbl, txt, size, color) =>
        lbl.setMarkup(`<span color='${color}' font='${size}'>${txt}</span>`);

  function setButton(txt, size, color) {
    let lbl = new Gtk.Label();
    write(lbl, txt, size, color);
    let btn = new Gtk.Button();
    btn.add(lbl);
    return btn;
  }

  function save(tNum, track) {
    lib.save([st.art, st.alb, tNum, track])
  }

  function selectTrack(n) {
    // change color
    player.playTrack(n);
  }

  function switchTo(stack) {
    view.stack.setVisibleChildName(stack);
    view.search.bar.setSearchMode(stack == 'arts');
  }

  const setVolume = delta =>
        write(view.labels.vol, Math.ceil(player.volume(delta)*100), 16, 'red');


  return {run, save, writeTrack}
}

require('GLib').setPrgname('Audio Gnome');
let app = App();
let player = require('./player.js').Player(app)
app.run(player);
