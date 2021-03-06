const player = exports,
      Gst = imports.gi.Gst,
      fs = require('fs'),
      path = require('path'),
      lib = require('./lib'),
      time = (t) => new Date(t/1e6).toISOString().substr(14, 5),
      path2uri = p => `file://${p}`;

let view = null;

Gst.init(null, 0);

player.Player = function(theApp) {

  let app = theApp,
      bin = Gst.ElementFactory.make("playbin", "play"),
      bus = bin.get_bus(),
      tracks: [],
      duration = 0,
      bitrate = 0,
      tNum = null;


  function init(theView) {
    view = theView;
    bus.addSignalWatch();
    bus.connect('message', function(bus, msg) {

      if (msg.type == Gst.MessageType.TAG) {
        let rate = msg.parse_tag().get_uint('bitrate')[1];
        if (rate != bitrate) {
          bitrate = rate;
          view.writeLabel('rate', ` ${(bitrate/1e3).toFixed(0)} kbps `);
        }
      }

      if (msg.type == Gst.MessageType.EOS) {
        let next = tNum + 1;
        if (next == tracks.length)
          app.nextAlbum();
        else
          playTrack(next);
      }
    });
  };

  const loadAlbum = alb => tracks = lib.loadTracks(alb);

  function playTrack(num) {
    view.changeColors('tracks', tNum, num);
    tNum = num;
    let track = tracks[tNum];
    let base = path.basename(track)
    view.setFont('track', lib.fontSize(base.length, 'info'));
    view.writeLabel('track', base);
    bin.set_state(Gst.State.NULL);
    duration = 0;
    bin.set_property('uri', path2uri(track));
    bin.set_state(Gst.State.PLAYING);
    app.save(tNum, base);
  };

  function updatePosition() {
    if (!isPlaying())
      return;

    if (!duration)
      duration =  bin.query_duration(Gst.Format.TIME)[1];

    let pos = bin.query_position(Gst.Format.TIME)[1];
    view.slider.fraction = pos/duration;
    view.slider.text = `${time(pos)}/${time(duration)}`;
  };

  function changeState() {
    if (isPlaying())
      bin.setState(Gst.State.PAUSED);
    else if (isPaused())
      bin.setState(Gst.State.PLAYING);
  }

  const isPlaying = () => bin.getState(1000)[1] == Gst.State.PLAYING;

  const isPaused = () => bin.getState(1000)[1] == Gst.State.PAUSED;

  const getTracks = () => tracks;

  function volume(delta) {
    let db = Math.log(bin.volume)*Math.LOG10E*10 + delta;
    // Math.log10 is not available
    let vol = Math.pow(10, db/10);
    if (vol < 10)
      bin.volume = vol;
    view.switchTo('player');
    view.writeLabel('vol', ` ${db.toFixed(0)} db `);
  }

  const stop = () => bin.setState(Gst.State.NULL);

  return { getTracks, init, updatePosition, loadAlbum, playTrack, changeState, volume, stop }
}
