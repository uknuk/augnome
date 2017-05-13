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
      case 'Up':
      case 'Down':
        view.scroll(key);
        break;
      case 'F11':
        player.volume(-1);
        break;
      case 'F12':
        player.volume(1);
        break
      case 'space':
        player.changeState();
        break;
      case 'Escape':
        st.selArt = st.art;
        addAlbums();
        view.switchTo('player');
        break;
      case 'F1':
        st.arts = lib.loadArtists();
        if (view.stack.visibleChildName == "arts")
          showArtists();
        break;
      default:
        return false;
      }
      return true;
    });
  }

  function selectAlbum(aNum, tNum) {
    st.art = st.selArt;
    st.albs = st.selAlbs;
    playAlbum(aNum, tNum);
  }

  function playAlbum(aNum, tNum = 0) {
    view.changeColors('albs', st.aNum, aNum);
    st.aNum = aNum;
    view.setFont('rec', lib.fontSize((st.art + st.alb).length, 'info'));
    view.writeLabel('art', st.art);
    st.alb = st.albs[st.aNum];
    view.writeLabel('alb', lib.base(st.alb));
    player.loadAlbum(path.join(st.arts[st.art], st.alb));
    let tracks = player.getTracks().map(t => lib.shortBase(t, 25));
    setFont('tracks',tracks);
    addButtons('tracks', tracks, player.playTrack);
    player.playTrack(tNum);
  }

  function nextAlbum() {
    let next = st.aNum + 1;
    if (next < st.albs.length)
      playAlbum(next);
  }


  function showArtists(entry = null) {
    let arts = Object.keys(st.arts)
    if (entry) {
      if (entry.slice(-1) == '§') {
        let sel = entry.slice(0, -1);
        arts = arts.filter(art => art.toLowerCase() == sel)
      }
      else
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

  function addAlbums() {
    //print(st.selArt);
    st.selAlbs = lib.loadAlbums(st.arts[st.selArt]);
    //print(st.selAlbs);
    let albs = st.selAlbs.map(alb => lib.shortBase(alb, 40));
    setFont('albs', albs);
    addButtons('albs', albs, selectAlbum);
  }

  function addButtons(type, labels, fun) {
    for (let child of view.panes[type].getChildren())
      child.destroy();

    let n = 0;
    for (let lbl of labels) {
      let btn = view.setButton(type, lbl, n);
      btn.on("clicked", fun.bind(null, n, 0));
      n++;
      view.panes[type].add(btn);
    }

    view.win.showAll();
  }

  function save(tNum, track) {
    lib.save([st.art, st.alb, tNum, track])
  }

  const setFont = (type, items) =>
      view.setFont(type, lib.fontSize(items.reduce((s, n) => s + n.length, 0), type));

  return {run, save, nextAlbum}
}

require('GLib').setPrgname('Audio Gnome');
let app = App();
let player = require('./player.js').Player(app)
app.run(player);
