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

  let frames = {
    player: new Gtk.Box({orientation: Gtk.Orientation.VERTICAL}),
    arts: new Gtk.FlowBox(),
  }

  let panes = {
    info: new Gtk.Box(),
    slider: new Gtk.Box(),
    albs: new Gtk.FlowBox(),
    tracks: new Gtk.FlowBox(),
  }

  for (let p in panes) {
    frames.player.packStart(panes[p], false, false, 1);
  }

  let labels = {}
  for (let l of ['art', 'alb', 'track']) {
    labels[l] = new Gtk.Label();
    panes.info.packStart(labels[l], false, false, 1);
  }

  labels.pos = new Gtk.Label();
  panes.slider.packStart(labels.pos, false, false, 1);

  let stack = new Gtk.Stack()
  stack.addTitled(frames.player, "player", "Player");
  stack.addTitled(frames.arts, "arts", "Artists");

  let switcher = new Gtk.StackSwitcher();
  switcher.setStack(stack);
  header.add(switcher);

  let searchBar = new Gtk.SearchBar();
  searchBar.show();

  let searchEntry = new Gtk.SearchEntry();
  searchEntry.show();

  searchBar.connectEntry(searchEntry);
  searchBar.add(searchEntry);
  searchBar.setSearchMode(true);
  header.add(searchBar);

  let scroll = new Gtk.ScrolledWindow();
  scroll.add(stack);

  win.add(scroll);

  return {win, scroll, stack, switcher, labels, panes, frames, header}
}
