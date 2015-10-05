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
      self.audioNode = {};

      $('[type=' + self.files + ']').addClass('typeactive');
      self.eventinit();
      self.audiocontext();

      self.audioNode.analyser = context.createAnalyser();
      self.audioNode.delay = context.createDelay();
      self.audioNode.biquadFilter = context.createBiquadFilter();
      
      self.audioNode.biquadFilter.frequency.value = 4400;
      self.audioNode.biquadFilter.Q.value = 1;

      self.audioNode.biquadFilter.connect(self.audioNode.delay);
      self.audioNode.delay.connect(self.audioNode.analyser);
      self.audioNode.analyser.connect(context.destination);

      new Effect(document.getElementById("graph"), self.audioNode.analyser);
    },
    eventinit: function () {
      var self = this;
      self.jrange('.voiceall', 0, 100, 130, function (e) {
        var $target = $(this.inputNode);
        var type = $target.attr("vtype");

        self.changevoice(type, e);
      });
      self.jrange('#ctrl-frequency', 0, 20000, 252, function (val) {
        self.audioNode.biquadFilter.frequency.value = val;
      });
      self.jrange('#ctrl-q', 1, 100, 252, function (val) {
        self.audioNode.biquadFilter.Q.value = val;
      });
      // self.jrange('#ctrl-gain', 1, 10, 252, function (val) {
      //   self.audioNode.biquadFilter.gain.value = val;
      // });
      self.changestype = self.calls(self.changestype);
      self.mute = self.calls(self.mute);
      self.addsource = self.calls(self.addsource);
      self.events();
      self.initDelay();
    },
    events: function () {
      $('.menu .type').on('click', this.changestype);
      $('.conleft .source').on('click', this.addsource);
      $('#biquadFilters').on('click', 'a', this.switchFilterTypes.bind(this));
    },
    switchFilterTypes: function (e) {
      var self = this;
      var $t = $(e.target);
      $t.addClass('active').siblings('.active').removeClass('active');
      self.audioNode.biquadFilter.type = $t.text().toLocaleLowerCase();
    },
    initDelay: function () {
        var self = this;
        $("#effects-delay-input").knob({
            change : function (value) {
                if(!self.audioNode.delay) return;
                self.audioNode.delay.delayTime.value = value;
            }
        });
    },
    addsource: function (e) {
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
    play: function (buffer) {
      var self = this;
      var gain = context.createGain();
      var source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(self.audioNode.biquadFilter);
      
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
    jrange: function (selector, from, to, width, callback) {
      var self = this;
      $(selector).jRange({
        from: from,
        to: to,
        showLabels: false,
        showScale: false,
        width: width,
        onstatechange: callback
      });
    },
    changevoice: function (type, val) {
      var self = this;
      Object.keys(self.gain).forEach(function (v) {
        console.log(v, self.gain[v]);
      })
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