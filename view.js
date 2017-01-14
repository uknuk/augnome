const view = exports,
      Gtk = require('Gtk'),
      Gdk = require('Gdk');

view.View = function(app) {
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
  css.loadFromData("* { font-size: 11px; font-weight: bold; color: blue; }");

  let frames = {
    player: new Gtk.Box({orientation: Gtk.Orientation.VERTICAL}),
    arts: new Gtk.TextView({buffer: buffer, wrapMode: Gtk.WrapMode.WORD}),
  }

  frames.arts.getStyleContext().addProvider(css, 0);


  let panes = {
    info: new Gtk.FlowBox(),
    slider: new Gtk.Box(),
    sep1: new Gtk.HSeparator(),
    albs: new Gtk.FlowBox({maxChildrenPerLine: 10}),
    sep2: new Gtk.HSeparator(),
    tracks: new Gtk.FlowBox({maxChildrenPerLine: 15})
  }

  for (let p in panes) {
    frames.player.packStart(panes[p], false, false, 1);
  }

  let labels = {}
  for (let l of ['art', 'alb', 'track']) {
    labels[l] = new Gtk.Label();
    //panes.info.add(labels[l], false, false, 1);
    panes.info.add(labels[l]);
  }

  labels.pos = new Gtk.Label();
  panes.slider.add(labels.pos, false, false, 1);

  labels.vol = new Gtk.Label();
  panes.slider.add(labels.vol, false, false, 1);

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

  let scroll = new Gtk.ScrolledWindow();
  scroll.add(stack);

  win.add(scroll);

  return {win, scroll, stack, switcher, labels, panes, frames, header, buffer, search}
}
