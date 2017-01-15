const player = exports,
      Gst = imports.gi.Gst,
      fs = require('fs'),
      path = require('path'),
      lib = require('./lib'),
      time = (t) => new Date(t/1e6).toISOString().substr(14, 5),
      path2uri = p => `file://${p}`;

Gst.init(null, 0);

player.Player = function(theApp) {

  let app = theApp,
      bin = Gst.ElementFactory.make("playbin", "play"),
      bus = bin.get_bus(),
      tracks: [],
      tNum = 0;


  function init() {
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
    let d = [bin.query_position(Gst.Format.TIME)[1], bin.query_duration(Gst.Format.TIME)[1]]
    app.position(d[0]/d[1], `${time(d[0])}/${time(d[1])}`);
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
    return db.toFixed(0);
  }

  const stop = () => bin.setState(Gst.State.NULL);

  return { getTracks, init, isPlaying, updatePosition, playAlbum, playTrack, changeState, volume, stop }
}
