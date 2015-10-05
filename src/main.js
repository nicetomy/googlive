/* global $ */
/* global Effect */

; (function () {
  var context;

  var googlive = {
    init: function () {
      var self = this;

      self.files = 'techno';

      self.source = {};
      self.gain = {};
      self.fx = {};
      self.timmer = {
        delay: 0
      };

      $('[type=' + self.files + ']').addClass('typeactive');
      self.eventinit();
      self.audiocontext();
      self.analyser = context.createAnalyser();

      new Effect(document.getElementById("graph"), self.analyser);
    },
    eventinit: function () {
      var self = this;
      self.jrange();
      self.changestype = self.calls(self.changestype);
      self.mute = self.calls(self.mute);
      self.addsource = self.calls(self.addsource);
      self.events();
      self.initDelay();
    },
    events: function () {
      $('.menu .type').on('click', this.changestype);
      // $('.menu .mute').on('click', this.mute);
      $('.conleft .source').on('click', this.addsource);
    },
    initDelay: function () {
        var self = this;
        $("#effects-delay-input").knob({
            change : function (value) {
                if(!self.fx.delay) return;
                self.fx.delay.delayTime.value = value;
            }
        });
    },
    delay: function (e) {
      if (e.type === 'mousedown') {
        console.log('down')
      } else if (e.type === 'mouseup') {
        console.log('up')
      }
      if (!this.fx.delay.delayTime.value) {
        this.fx.delay.delayTime.value = 10;
      } else {
        this.fx.delay.delayTime.value = 0;
      }
    },
    addsource: function (e) {
      var $target = $(e.target),
        num = $target.attr('num'),
        self = this;

      self.loadsample(context, 'src/files/' + self.files + '/' + self.files + num + '.wav', function (b) {
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
    mute: function (e) {
      var $target = $(e.target),
        hasClass = null;

      $target.toggleClass('mactive');
      hasClass = $target.hasClass('mactive');

      hasClass = hasClass ? 0 : 1;

      this.gaina.gain.setTargetAtTime(hasClass, 0, 0.001);

      return false;
    },
    loadstype: function (files) {
      var self = this;
      self.loadsample(context, 'src/files/' + files + '/Drum.wav', function (b) {
        var obj = self.play(b);
        self.sourceall = obj.source;
        self.gaina = obj.gain;

        self.gaina.gain.value = $('#voiceall').val() / 100;
        self.sourceall.start(0);
      });
    },
    changestype: function (e) {
      var $target = $(e.target),
        files = $target.attr('type');

      $('.menu .type').removeClass('typeactive');
      $target.addClass('typeactive');
      this.files = files;
      this.sourceall.stop(0);
      for (var k in this.source) {
        this.source[k].stop(0);
      }
    },
    play: function (buffer) {
      var gain = context.createGain();
      var source = context.createBufferSource();
      if (!this.fx.delay) {
        console.log('fix delay')
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
    audiocontext: function () {
      try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
      } catch (e) {
        alert('Web Audio API is not supported in this browser');
      }
    },
    loadsample: function (ctx, url, callback) {
      var self = this;
      var req = new XMLHttpRequest();
      req.open("GET", url, true);
      req.responseType = "arraybuffer";
      req.onload = function () {
        if (req.response) {
          ctx.decodeAudioData(req.response, function (b) {
            callback && callback(b);
          }, function () { });
        }
      }
      req.send();
    },
    jrange: function () {
      var self = this;
      $('.voiceall').jRange({
        from: 0,
        to: 100,
        showLabels: false,
        showScale: false,
        width: 130,
        onstatechange: function (e) {
          var $target = $(this.inputNode),
            type = $target.attr("vtype");

          self.changevoice(type, e);
        }
      });
      
      $('.filter-ctrl').jRange({
        from: 0,
        to: 100,
        showLabels: false,
        showScale: false,
        width: 252,
        onstatechange: function (e) {
          var $target = $(this.inputNode),
            type = $target.attr("vtype");

          self.changevoice(type, e);
        }
      });
    },
    changevoice: function (type, val) {
      var self = this;
      switch (type) {
        case 'voiceall':
          self.gaina.gain.value = val * 0.01;
          break;
        default:
          if (self.gain[type]) {
            self.gain[type].gain.value = val * 0.01;
          }
          break;
      }
    },
    calls: function (fn) {
      var self = this;
      var f = function (e) {
        fn.call(self, e);
      };
      return f;
    }
  };
  googlive.init();
})();