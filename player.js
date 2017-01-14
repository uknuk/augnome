const player = exports,
      Gst = imports.gi.Gst,
      fs = require('fs'),
      path = require('path'),
      lib = require('./lib'),
      time = r => r[0] ? new Date(r[1]/1e6).toISOString().substr(14, 5) : "00:00",
      path2uri = p => `file://${p}`;

Gst.init(null, 0);

player.Player = function(theApp) {

  let app = theApp,
      bin = Gst.ElementFactory.make("playbin", "play"),
      bus = bin.get_bus(),
      view = null,
      tracks: [],
      tNum = 0;


  function init(theView) {
    view = theView;
    bus.addSignalWatch();
    bus.connect('message', function(bus, msg) {
      if (msg.type == Gst.MessageType.EOS) {
        tNum++;
        playTrack();
      }
    });
  };

  function playAlbum(alb, num) {
    tracks = lib.loadTracks(alb);
    playTrack(num);
  };

  function playTrack(num = null) {
    if (num != null)
      tNum = num;
    let track = tracks[tNum];
    let base = path.basename(track)
    app.writeTrack(base);
    bin.set_state(Gst.State.NULL);
    bin.set_property('uri', path2uri(track));
    bin.set_state(Gst.State.PLAYING);
    app.save(tNum, base);
  };

  function updatePosition() {
    var  d = [
      time(bin.query_position(Gst.Format.TIME)),
      time(bin.query_duration(Gst.Format.TIME))
    ];
    view.labels.pos.label = `${d[0]} ${d[1]}`;
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
    if (bin.volume < 10 && bin.volume > 0.1)
      bin.volume += delta;
    return bin.volume;
  }

  const stop = () => bin.setState(Gst.State.NULL);

  return { getTracks, init, isPlaying, updatePosition, playAlbum, playTrack, changeState, volume, stop }
}
