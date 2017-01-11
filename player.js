const player = exports,
      Gst = imports.gi.Gst,
      //mainloop = imports.mainloop,
      fs = require('fs'),
      path = require('path'),
      lib = require('./lib'),
      time = r => r[0] ? new Date(r[1]/1e6).toISOString().substr(14, 5) : "00:00",
      path2uri = p => `file://${p}`;

Gst.init(null, 0);

player.Player = function() {
  // private
  var app =  null,
      bin = Gst.ElementFactory.make("playbin", "play"),
      bus = bin.get_bus();

  // public
  var tracks = [],
      albs = [],
      tNum = 0,
      aNum =null;


  var init = function(_app) {
    app = _app;
    bus.add_signal_watch();
    bus.connect('message', function(bus, msg) {
      if (msg.type == Gst.MessageType.EOS) {
        tNum++;
        playTrack();
      }
    });
  };

  var  playAlbum = function(alb, num) {
    tracks = lib.loadTracks(alb);
    playTrack(num);
  };

  var playTrack = function(num = null) {
    if (num != null)
      tNum = num;
    let track = tracks[tNum]
    app.view.labels.track.label = path.basename(track);
    bin.set_state(Gst.State.NULL);
    bin.set_property('uri', path2uri(track));
    bin.set_state(Gst.State.PLAYING);
    app.save(tNum);
  };

  var updatePosition = function() {
    var  d = [
      time(bin.query_position(Gst.Format.TIME)),
      time(bin.query_duration(Gst.Format.TIME))
    ];
    app.view.labels.pos.label = `${d[0]} ${d[1]}`;
  };

  var  changeState = function() {
    if (isPlaying())
      bin.setState(Gst.State.PAUSED);
    else if (isPaused())
      bin.setState(Gst.State.PLAYING);
  };

  var isPlaying = () => bin.getState(1000)[1] == Gst.State.PLAYING;

  var isPaused = () => bin.getState(1000)[1] == Gst.State.PAUSED;

  var getTracks = () => tracks;

  let volume = function(delta) {
    if (bin.volume < 1 && bin.volume > 0)
      bin.volume += delta;
  }

  return { getTracks, init, isPlaying, updatePosition, playAlbum, playTrack, changeState, volume }
}
