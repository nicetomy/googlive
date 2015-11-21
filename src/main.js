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
      self.timmer = {};

      $('[type=' + self.files + ']').addClass('typeactive');
      self.eventinit();
      self.audiocontext();

      self.audioNode.analyser = context.createAnalyser();
      self.audioNode.biquadFilter = context.createBiquadFilter();
      self.audioNode.reverb = new SimpleReverb(context, {
        seconds: 0,
        decay: 0,
        reverse: 1
      });
      self.audioNode.biquadFilter.frequency.value = 4400;
      self.audioNode.biquadFilter.Q.value = 1;

      self.audioNode.biquadFilter.connect(self.audioNode.analyser);
      self.audioNode.analyser.connect(context.destination);
      
      self.fullscreen();
      
    },
    fullscreen: function (flag) {
      var self = this;
      if (flag) {
        $('#graph').attr('width', $(window).width() + "px");
        $('#graph').attr('height', $(window).height() + "px");
        self.Effect = new Effect(document.getElementById("graph"), self.audioNode.analyser);
      } else {
        $('#graph').attr('width', ($(window).width() - 320 * 2) + "px");
        $('#graph').attr('height', "500px");
        self.Effect = new Effect(document.getElementById("graph"), self.audioNode.analyser);
      }
    },
    animate: function (flag) {
      
      if (flag) {
        $(".header").show();
        $(".conleft").show();
        $(".conright").show();
        
        $(".middle").css({'position': 'static'});
        $(".middle").css({
          'width':'auto',
          'height':500
        });
      } else {
        $(".header").hide();
        $(".conleft").hide();
        $(".conright").hide();
        
        $(".middle").css({'position': 'fixed','height':'100px','width':'100px','top':'50%','left':'50%'});
        $(".middle").animate({
          'top':0,
          'left':0,
          'z-index': 100,
          'width':$(window).width(),
          'height':$(window).height()
        },600);
      }
    },
    eventinit: function () {
      var self = this;
      self.jrange('.voiceall', 0, 100, 130, function (e) {
        var $target = $(this.inputNode);
        var type = $target.attr("vtype");

        self.changevoice(type, e);
      });

      self.jrange('#ctrl-frequency', 0, 20000, 240, function (val) {
        self.audioNode.biquadFilter.frequency.value = val;
      });
      self.jrange('#ctrl-q', 1, 10, 240, function (val) {
        self.audioNode.biquadFilter.Q.value = val;
      });
      self.jrange('#ctrl-gain', 1, 10, 240, function (val) {
        self.audioNode.biquadFilter.gain.value = val;
      });
      
      // reverb seconds
      $("#ctrl-seconds").knob({
          change : function (value) {
            var val = (100 * value) / 128;
            console.log('val', val);
            self.audioNode.reverb.seconds = val;
          }
      });
      // reverb decay
      $("#ctrl-decay").knob({
          change : function (value) {
            var val = (100 * value) / 128;
            self.audioNode.reverb.decay = val;
          }
      });

      self.changestype = self.calls(self.changestype);
      self.mute = self.calls(self.mute);
      self.mousemove = self.calls(self.mousemove);
      self.keydown = self.calls(self.keydown);
      self.addsource = self.calls(self.addsource);
      self.events();
      self.initDelay();
      self.initMidi();
    },
    initMidi: function () {
      var self = this;
      var wmaw = new WebMIDIAPIWrapper( true );
      window.addEventListener('midiin-event:foo-input', function(event) {
        var out=[];
        for(var i=0; i<event.detail.data.length; i++) {
          out.push("0x"+("00"+event.detail.data[i].toString(16)).substr(-2));
        }
        var result=wmaw.parseMIDIMessage(out);
        var tmp = {};
        if(typeof result.type!="undefined") {
          tmp.type = result.type;
        }
        if(typeof result.subType!="undefined") {
          tmp.subType = result.subType;
        }
        if(typeof result.event.channel!="undefined") {
          tmp.channel = result.event.channel;
        }
        if(typeof result.event.ctrlName!="undefined") {
          tmp.ctrlName = result.event.ctrlName;
        }
        if(typeof result.event.ctrlNo!="undefined") {
          tmp.ctrlNo = +result.event.ctrlNo;
        }
        if(typeof result.event.ctrlStatus!="undefined") {
          tmp.ctrlStatus = result.event.ctrlStatus;
        }
        if(typeof result.event.programNumber!="undefined") {
          tmp.programNumber = result.event.programNumber;
        }
        if(typeof result.event.valueType!="undefined") {
          tmp.valueType = result.event.valueType;
        }
        if(typeof result.event.noteNumber!="undefined") {
          tmp.noteNumber = result.event.noteNumber;
        }
        if(typeof result.event.velocity!="undefined") {
          tmp.velocity = result.event.velocity;
        }
        if(typeof result.event.value!="undefined") {
          tmp.value = +result.event.value;
        }
        if(typeof result.event.amount!="undefined") {
          tmp.amount = result.event.amount;
        }
        
        self.handleMidi(tmp);
      });
    },
    handleMidi: function (data) {
      var self = this;
      var code = data.ctrlNo;
      var val = data.value && (100 * data.value)/128;
      
      // style
      if(code >= 41 && code <= 45) {
        $('[data-code="' + code + '"]').click();
      }
      
      if(code === 16) {
        $('#ctrl-seconds').val(data.value).trigger('change');
        clearTimeout(self.timmer.seconds);
        self.timmer.seconds = setTimeout(function () {
          val = (100 * data.value) / 128;
          self.audioNode.reverb.seconds = val;
        }, 100);
          
      }
      
      if(code === 17) {
        $('#ctrl-decay').val(data.value).trigger('change');
        clearTimeout(self.timmer.decay);
        self.timmer.decay = setTimeout(function () {
          val = (100 * data.value) / 128;
          self.audioNode.reverb.decay = val;
        }, 100);
      }
      
      // delay
      if(code === 23) {
        $('#effects-delay-input').val(val).trigger('change');
      }
      
      // style 音量
      if(code === 6) {
        $('#totalvoice').jRange('setValue', val);
      }
      // 总音量
      if(code === 7) {
        $('#voiceall').jRange('setValue', val);
      }
      
      // sample
      if(code >= 64 && code <= 69) {
        $('[data-code="' + code + '"]').click();
      }
      if(code >= 0 && code <= 5) {
        if(code === 5) code = 6;
        $('#source' + code).jRange('setValue', val);
      }
      console.log('code', code);
    },
    events: function () {
      $('.menu .type').on('click', this.changestype);
      $('.conleft .source').on('click', this.addsource);
      $(window).on('keydown', this.keydown);
      $('#biquadFilters').on('click', 'a', this.switchFilterTypes.bind(this));
      $('#reverb-wrapper').on('click', 'a', this.switchReverb.bind(this));
    },
    switchReverb: function (e) {
      var self = this;
      var $t = $(e.target);
      if($t.hasClass('active')) {
        $t.removeClass('active');
        self.audioNode.biquadFilter.disconnect(self.audioNode.reverb.input);
        self.audioNode.biquadFilter.connect(self.audioNode.analyser);
      } else {
        $t.addClass('active');
        self.audioNode.biquadFilter.disconnect(self.audioNode.analyser);
        self.audioNode.biquadFilter.connect(self.audioNode.reverb.input);
        self.audioNode.reverb.connect(self.audioNode.analyser);
      }
    },
    keydown: function (e) {
      if (e.keyCode === 65) {
        this.Effect.clearrect();
        this.fullscreen(true);
        this.animate();
      }
      if (e.keyCode === 27) {
        this.Effect.clearrect();
        this.fullscreen();
        this.animate(true);
      }
    },
    mousemove: function () {
      clearTimeout(this.fullScreentime);
      if (this.fullflag) {
        this.Effect.clearrect();
        this.animate(true);
        this.fullscreen();
        this.fullflag = false;
      }
      this.settimeout();
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