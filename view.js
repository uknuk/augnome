const view = exports,
      Gtk = require('Gtk'),
      Gdk = require('Gdk');

view.View = function(app) {
  const color = {
    art: 'blue',
    selArts: 'blue',
    alb: 'green',
    track: 'blue',
    tracks: 'blue',
    albs: 'green',
    vol: 'red',
    rate: 'blue'
  };

  let fontSize = {
    art: 24,
    alb: 24,
    track: 20,
    tracks: 16,
    albs: 20,
    vol: 14,
    rate: 14,
    selArts: 24
  };

  let win = new Gtk.ApplicationWindow(
    { application: app,
      defaultHeight: 572,
      defaultWidth: 1024,
      windowPosition: Gtk.WindowPosition.CENTER
    });

  let header = new Gtk.HeaderBar({title: "Audio Gnome Invisible"});
  header.setShowCloseButton(true);
  win.setTitlebar(header);

  let buffer = new Gtk.TextBuffer();

  let css = new Gtk.CssProvider();
  css.loadFromData("GtkTextView { font-size: 16px; font-weight: bold; color: #a00; }");

  let frames = {
    player: new Gtk.Box({orientation: Gtk.Orientation.VERTICAL}),
    arts: new Gtk.Box({orientation: Gtk.Orientation.VERTICAL})
    //arts: new Gtk.TextView({buffer: buffer, wrapMode: Gtk.WrapMode.WORD}),
  }

  let selArts = new Gtk.FlowBox({maxChildrenPerLine: 10});
  let text = new Gtk.TextView({buffer: buffer, wrapMode: Gtk.WrapMode.WORD});

  text.getStyleContext().addProvider(css, 0);

  frames.arts.packStart(selArts, false, false, 1);
  frames.arts.packStart(text, false, false, 1);

  let panes = {
    song: new Gtk.FlowBox({selectionMode: 0}), //NONE
    info: new Gtk.Box(),
    sep1: new Gtk.HSeparator(),
    albs: new Gtk.FlowBox({maxChildrenPerLine: 10}),
    sep2: new Gtk.HSeparator(),
    tracks: new Gtk.FlowBox({maxChildrenPerLine: 15})
  }

  for (let p in panes) {
    frames.player.packStart(panes[p], false, false, 1);
  }

  panes.selArts = selArts;

  let labels = {tracks: [], albs: [], selArts: []}
  for (let l of ['art', 'alb', 'track']) {
    labels[l] = new Gtk.Label();
    panes.song.add(labels[l]);
  }


  labels.vol = new Gtk.Label();
  panes.info.packEnd(labels.vol, false, false, 1);

  labels.rate = new Gtk.Label();
  panes.info.packEnd(labels.rate, false, false, 1);

  let slider = new Gtk.ProgressBar({showText: true});
  panes.info.packStart(slider, true, true, 1);

  let stack = new Gtk.Stack()
  stack.addTitled(frames.player, "player", "Player");
  stack.addTitled(frames.arts, "arts", "Artists");

  let switcher = new Gtk.StackSwitcher();
  switcher.setStack(stack);
  header.add(switcher);

  let search = {
    bar: new Gtk.SearchBar(),
    entry: new Gtk.SearchEntry()
  }

  search.bar.show();
  search.entry.show();

  search.bar.connectEntry(search.entry);
  search.bar.add(search.entry);
  header.add(search.bar);

  let scrollWin = new Gtk.ScrolledWindow();
  scrollWin.add(stack);

  win.add(scrollWin);

  const write = (lbl, txt, size, color) =>
        lbl.setMarkup(`<span color='${color}' font='${size}'>${txt.replace('&','&amp;')}</span>`);

  const writeLabel = (type, txt) => write(labels[type], txt, fontSize[type], color[type])

  function setButton(type, txt, n) {
    let lbl = new Gtk.Label();
    labels[type][n] = lbl;
    write(lbl, txt, fontSize[type], color[type]);
    let btn = new Gtk.Button();
    btn.add(lbl);
    return btn;
  }

  const changeColor = (type, n, from, to) => {
    labels[type][n].setMarkup(labels[type][n].label.replace(from, to));
  }

  function changeColors(type, prev, next) {
    if (prev != null)
      changeColor(type, prev, "'red'", `'${color[type]}'`);
    changeColor(type, next, `'${color[type]}'` , "'red'");
  }

  function switchTo(name) {
    stack.setVisibleChildName(name);
    search.bar.setSearchMode(name == 'arts');
  }

  function setFont(type, size) {
    if (type == 'rec')
      fontSize.alb = fontSize.art = size;
    else
      fontSize[type] = size;
  }

  function scroll(dir) {
    let adjust = scrollWin.vadjustment;
    adjust.value += (dir == 'Down' ? adjust.pageSize : -adjust.pageSize);
  }




  return {win, stack, switcher, labels, panes, frames, header, buffer, search, slider, fontSize,
          setButton, changeColors, writeLabel, switchTo, setFont, scroll}
}
