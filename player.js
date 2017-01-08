const Gst = imports.gi.Gst,
      //mainloop = imports.mainloop,
      fs = require('fs'),
      path = require('path'),
      lib = require('./lib');

Gst.init(null, 0);


module.exports = (function() {

  var time = r => r[0] ? new Date(r[1]/1e6).toISOString().substr(14, 5) : "00:00",
      bin = Gst.ElementFactory.make("playbin", "play"),
      bus = bin.get_bus(),
      path2uri = p => `file://${p}`;

  return {

    tracks: [],
    track: null,
    albums: [],
    tNum: 0,
    aNum: null,

    init: function() {
      bus.add_signal_watch();
      bus.connect('message', (function(bus, msg) {
        if (msg.type == Gst.MessageType.EOS) {
          this.tNum++;
          bin.set_state(Gst.State.NULL);
          this.playTrack();
        }
      }).bind(this));
    },

    playAlbum: function(alb, num) {
      this.tracks = lib.loadTracks(alb);
      this.playTrack(num);
    },

    playTrack: function(num = null) {
      if (num)
        this.tNum = num;
      this.track = this.tracks[this.tNum];
      print(this.track);
      bin.set_property('uri', path2uri(this.track));
      bin.set_state(Gst.State.PLAYING);
    },

    readPosition: function() {
        return [
            time(bin.query_position(Gst.Format.TIME)),
            time(bin.query_duration(Gst.Format.TIME))
        ];
    },

    changeState: function() {
      if (this.isPlaying())
        bin.setState(Gst.State.PAUSED);
      else if (this.isPaused())
        bin.setState(Gst.State.PLAYING);
    },

    isPlaying: () => bin.getState(1000)[1] == Gst.State.PLAYING,

    isPaused: () => bin.getState(1000)[1] == Gst.State.PAUSED,

  };

}());
