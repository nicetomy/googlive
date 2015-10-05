(function() {
  var context;

  var googlive = {
    init: function() {
      var self = this;

      self.files = 'techno';

      self.source = {};
      self.gain = {};
      self.fx = {};
      self.analyser = null;


      $('[type=' + self.files + ']').addClass('typeactive');
      self.eventinit();
      self.audiocontext();
      self.draw();
    },
    draw: function () {
        var self = this;
        var ctx = document.getElementById("graph").getContext("2d");
        var mode = 0;
        self.analyser = context.createAnalyser();
        self.analyser.fftSize = 1024;
        
        function DrawGraph() {
            ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
            ctx.fillRect(0, 0, 512, 256);
            ctx.strokeStyle="rgba(255, 255, 255, 1)";
            var data = new Uint8Array(512);
            if(mode == 0) self.analyser.getByteFrequencyData(data);
            else self.analyser.getByteTimeDomainData(data);
            if(mode!=0) ctx.beginPath();
            for(var i = 0; i < 256; ++i) {
                if(mode==0) {
                    ctx.fillStyle = "rgba(204, 204, 204, 0.8)";
                    ctx.fillRect(i*2, 256 - data[i], 1, data[i]);
                } else {
                    ctx.lineTo(i*2, 256 - data[i]);
                }
            }
            if(mode!=0) {
                ctx.stroke();
            }
            requestAnimationFrame(DrawGraph);
        }
        
        requestAnimationFrame(DrawGraph);
    },
    eventinit: function() {
      var self = this;
      self.jrange();
      self.changestype = self.calls(self.changestype);
      self.mute = self.calls(self.mute);
      self.addsource = self.calls(self.addsource);
      self.events();
    },
    events: function() {
      $('.menu .type').on('click', this.changestype);
      $('.conleft .source').on('click', this.addsource);
      $('#effects-delay').on('click', this.delay.bind(this));
    },
    delay: function (e) {
        if(!this.fx.delay.delayTime.value) {
            this.fx.delay.delayTime.value = 0.25;
        } else {
            this.fx.delay.delayTime.value = 0;
        }
        console.log('this.fx.delay.delayTime.value', this.fx.delay.delayTime.value);
    },
    addsource: function(e) {
      var $target = $(e.target),
        num = $target.attr('num'),
        self = this;
        
      if (self.source[num]) {
        return false;
      }
      $target.addClass('sourceaction');
      
      self.loadsample(context, 'src/files/' + self.files + '/' + self.files + num + '.wav', function(b) {
        var obj = self.play(b);

        self.source[num] = obj.source;
        self.gain[num] = obj.gain;

        self.gain[num].gain.value = $('#source' + num).val() / 100;
        for (var k in this.source) {
          this.source[k].setTargetAtTime(0, 0, 0.001);
        }
        self.source[num].start(0);
        for (var k in this.source) {
          this.source[k].setTargetAtTime(1, 0, 0.001);
        }
      });
    },
    changestype: function(e) {
      var $target = $(e.target),
        files = $target.attr('type');

      $('.menu .type').removeClass('typeactive');
      $target.addClass('typeactive');
      this.files = files;
      for (var k in this.source) {
        this.source[k].stop(0);
      }
      $('.conleft .source').removeClass('sourceaction');
      this.source = {};
    },
    play: function(buffer) {
      var gain = context.createGain();
      var source = context.createBufferSource();
      if(!this.fx.delay) {
        this.fx.delay = context.createDelay();
      }
      source.buffer = buffer;
      source.connect(this.fx.delay);
      this.fx.delay.connect(gain);
      // source.connect(gain);
      gain.connect(context.destination);
      source.connect(this.analyser);
      source.loop = true;

      return {
        source: source,
        gain: gain
      };
    },
    audiocontext: function() {
      try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
      } catch (e) {
        alert('Web Audio API is not supported in this browser');
      }
    },
    loadsample: function(ctx, url, callback) {
      var self = this;
      var req = new XMLHttpRequest();
      req.open("GET", url, true);
      req.responseType = "arraybuffer";
      req.onload = function() {
        if (req.response) {
          ctx.decodeAudioData(req.response, function(b) {
            callback && callback(b);
          }, function() {});
        }
      }
      req.send();
    },
    jrange: function() {
      var self = this;
      $('.voiceall').jRange({
        from: 0,
        to: 100,
        showLabels: false,
        showScale: false,
        width: 130,
        onstatechange: function(e) {
          var $target = $(this.inputNode),
            type = $target.attr("vtype");

          self.changevoice(type, e);
        }
      });
    },
    changevoice: function(type, val) {
      var self = this;
      switch (type) {
        case 'voiceall':
          for (var k in self.gain) {
            self.gain[k].gain.value = val * 0.01;
          }
          break;
        case 'totalvoice':
          for (var k in self.gain) {
            self.gain[k].gain.value = val * 0.01;
          }
          break;
        default:
          if (self.gain[type]) {
            self.gain[type].gain.value = val * 0.01;
          }
          break;
      }
    },
    calls: function(fn) {
      var self = this;
      var f = function(e) {
        fn.call(self, e);
      };
      return f;
    }
  };
  googlive.init();
})();