(function () {
    var ctx = null, grd = null;
    function Retangle(w, h, x, y) {
        this.w = w;
        this.h = h;
        this.x = x;
        this.y = y;
        this.jg = 4;
        this.power = 0;
        this.dy = y;
        this.dv = 100;
        this.num = 0;
    }
    
    Retangle.prototype.update = function (power, times) {
        this.power = power;
        this.num = ~~(this.power / this.h + 0.5);
        if (this.power > this.y - (this.dy + this.h)) {
            this.dy = this.y - this.power - this.h - 1;
        } else if (this.dy + this.h > this.y) {
            this.dy = this.y - this.h
        } else {
            this.dy += this.dv * times
        }

        this.draw();
    };

    Retangle.prototype.draw = function () {
        ctx.fillStyle = grd;
        var h = (~~(this.power / (this.h + this.jg))) * (this.h + this.jg);
        ctx.fillRect(this.x, this.y - h, this.w, h)
        for (var i = 0; i < this.num; i++) {
            var y = this.y - i * (this.h + this.jg);
            ctx.clearRect(this.x - 1, y, this.w + 2, this.jg);
        }
        ctx.fillStyle = "#950000";
        ctx.fillRect(this.x, this.dy, this.w, this.h);
    };
    
    function Effect(canvas, analyser) {
        this.canvas = canvas;
        this.outcanvas = null;
        this.analyser = analyser;

        ctx = this.canvas.getContext("2d");

        grd = ctx.createLinearGradient(0, 110, 0, 270);
        grd.addColorStop(0, "red");
        grd.addColorStop(0.3, "yellow");
        grd.addColorStop(1, "#00E800");
        
        this.tgs = [];
        this.tgn = 32;
        this.jg = 4;
        this.ot = 0;

        this.init();
    }

    Effect.prototype.init = function () {
        this.outcanvas = document.createElement("canvas");
        this.outcanvas.width = this.canvas.width;
        this.outcanvas.height = this.canvas.height / 2;

        var array = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(array);

        var w = this.canvas.width / this.tgn - this.jg;

        for (var i = 0; i < this.tgn; i++) {
            this.tgs.push(new Retangle(w, 5, (i * (this.canvas.width / this.tgn)), this.canvas.height / 2));
        }

        ot = new Date();
        this.animate();
    };

    Effect.prototype.animate = function () {
        var array = new Uint8Array(this.analyser.frequencyBinCount);
        
        this.analyser.getByteFrequencyData(array);
        
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.nt = new Date();
        
        for (var i = 0; i < this.tgs.length; i++) {
            this.tgs[i].update(array[~~(i * array.length / this.tgn)], (this.nt - this.ot) / 1000);
        }

        this.copy();
        this.ot = this.nt;
        window.requestAnimationFrame(this.animate.bind(this));
    };
    
    Effect.prototype.copy = function () {
        var outctx = this.outcanvas.getContext("2d");
        var imgdata = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height / 2);
        
        for (var i = 0; i < imgdata.data.length; i += 4) {
            imgdata.data[i + 3] = 50;
        }
        
        outctx.putImageData(imgdata, 0, 0);
        ctx.save();
        ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        ctx.rotate(Math.PI);
        ctx.scale(-1, 1);
        ctx.drawImage(this.outcanvas, -this.canvas.width / 2, -this.canvas.height / 2);
        ctx.restore();
    };
    
    window.Effect = Effect;
})();