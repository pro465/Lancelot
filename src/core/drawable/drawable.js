import { Component } from "../component.js";
import { Vector } from "../utils/vector.js";

export class Drawable extends Component {
    constructor(params) {
        super();
        this._type = "drawable";
        this._params = params;
        this._width = (this._params.width || 0);
        this._height = (this._params.height || 0);
        this._vertices = [];
        this._zIndex = (this._params.zIndex || 0);
        this.flip = {
            x: (this._params.flipX || false),
            y: (this._params.flipY || false)
        };
        this._scale = (params.scale || 1.0);
        this._rotationCount = (this._params.rotationCount || 0);
        this.opacity = this._params.opacity !== undefined ? this._params.opacity : 1;
        this.filter = (this._params.filter || "");
        this._angle = (this._params.angle || this._rotationCount * Math.PI / 2 || 0);
        this.fillStyle = (this._params.fillStyle || "black");
        this.strokeStyle = (this._params.fillStyle || "black");
        this.strokeWidth = (this._params.strokeWidth || 0);
        this.mode = (this._params.mode || "source-over");
    }
    get zIndex() {
        return this._zIndex;
    }
    set zIndex(val) {
        this._zIndex = val;
        if(this.scene) {
            this.scene._RemoveDrawable(this);
            this.scene._AddDrawable(this);
        }
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    set width(num) {
        this._width = num;
        this._ComputeVertices();
    }
    set height(num) {
        this._height = num;
        this._ComputeVertices();
    }
    set angle(num) {
        this._angle = num;
    }
    get angle() {
        return this._angle;
    }
    get rotationCount() {
        return this._rotationCount;
    }
    set rotationCount(num) {
        this._rotationCount = num;
        this.angle = this._rotationCount * Math.PI / 2;
    }
    get scale() {
        return this._scale;
    }
    set scale(num) {
        this._scale = num;
    }
    get boundingBox() {
        const vertices = this._vertices;
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for(let v of vertices) {
            if(v.x < minX) {
                minX = v.x;
            } else if(v.x > maxX) {
                maxX = v.x;
            }
            if(v.y < minY) {
                minY = v.y;
            } else if(v.y > maxY) {
                maxY = v.y;
            }
        }
        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = this.position.x + minX + width / 2;
        const centerY = this.position.y + minY + height / 2;
        return { x: centerX, y: centerY, width: width, height: height };
    }
    ParseStyle(ctx, s) {
        const params = s.split(";");
        const len = params.length;
        if(len === 1) {
            return s;
        }
        let grd;
        const values = params[1].split(",").map((s) => parseFloat(s));
        switch(params[0]) {
            case "linear":
                grd = ctx.createLinearGradient(...values);
                break;
            case "radial":
                grd = ctx.createRadialGradient(...values);
                break;
            default:
                return "black";
        }
        for(let i = 2; i < len; ++i) {
            const colorValuePair = params[i].split("=");
            grd.addColorStop(parseFloat(colorValuePair[1]), colorValuePair[0]);
        }
        return grd;
    }
    InitComponent() {
        this._ComputeVertices();
    }
    GetVertices() {
        return [
            new Vector(-this._width / 2, -this._height / 2),
            new Vector(this._width / 2, -this._height / 2),
            new Vector(-this._width / 2, this._height / 2),
            new Vector(this._width / 2, this._height / 2)
        ];
    }
    _ComputeVertices() {
        this._vertices = this.GetVertices();
        for(let i = 0; i < this._vertices.length; ++i) {
            const v = this._vertices[i];
            v.x *= this.flip.x ? -this.scale : this.scale;
            v.y *= this.flip.y ? -this.scale : this.scale;
            v.Rotate(this.angle);
        }
    }
    SetSize(w, h) {
        this._width = w;
        this._height = h;
    }
    Draw(_) { }
}

export class Text extends Drawable {
    constructor(params) {
        super(params);
        this._text = this._params.text;
        this._lines = this._text.split(/\n/);
        this._padding = (this._params.padding || 0);
        this._align = (params.align || "center");
        this._fontSize = (this._params.fontSize || 16);
        this._fontFamily = (this._params.fontFamily || "Arial");

        this._ComputeDimensions();
    }
    get linesCount() {
        return this._lines.length;
    }
    get lineHeight() {
        return this._fontSize + this._padding * 2;
    }
    get text() {
        return this._text;
    }
    set text(val) {
        this._text = val;
        this._ComputeDimensions();
    }
    get fontSize() {
        return this._fontSize;
    }
    set fontSize(val) {
        this._fontSize = val;
        this._ComputeDimensions();
    }
    get fontFamily() {
        return this._fontFamily;
    }
    set fontFamily(val) {
        this._fontFamily = val;
        this._ComputeDimensions();
    }
    get padding() {
        return this._padding;
    }
    set padding(val) {
        this._padding = val;
        this._ComputeDimensions();
    }
    get align() {
        return this._align;
    }
    set align(s) {
        this._align = s;
        this._ComputeDimensions();
    }
    _ComputeDimensions() {
        this._height = this.lineHeight * this.linesCount;
        let maxWidth = 0;
        const ctx = document.createElement("canvas").getContext("2d");
        ctx.font = `${this._fontSize}px '${this._fontFamily}'`;
        for(let line of this._lines) {
            const lineWidth = ctx.measureText(line).width;
            if(lineWidth > maxWidth) {
                maxWidth = lineWidth;
            }
        }
        this._width = maxWidth + this._padding * 2;
    }
    Draw(ctx) {
        let offsetX = this._align == "left" ? -this._width / 2 : this._align == "right" ? this._width / 2 : 0;
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.ParseStyle(ctx, this.fillStyle);
        ctx.font = `${this._fontSize}px '${this._fontFamily}'`;
        ctx.textAlign = this._align;
        ctx.textBaseline = "middle";
        ctx.beginPath();
        for(let i = 0; i < this.linesCount; ++i) {
            ctx.fillText(this._lines[i], offsetX + this._padding, this.lineHeight * i - (this.linesCount - 1) / 2 * this.lineHeight);
        }
        ctx.restore();
    }
}

export class Picture extends Drawable {
    constructor(params) {
        super(params);
        this._image = this._params.image;
        this._frameWidth = (this._params.frameWidth || this._image.width);
        this._frameHeight = (this._params.frameHeight || this._image.height);
        this._framePos = {
            x: (this._params.posX || 0),
            y: (this._params.posY || 0)
        };
    }
    Draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.rotate(this.angle);
        ctx.drawImage(this._image, this._framePos.x * this._frameWidth, this._framePos.y * this._frameHeight, this._frameWidth, this._frameHeight, -this._width / 2, -this._height / 2, this._width, this._height);
        ctx.restore();
    }
}

export class Rect extends Drawable {
    constructor(params) {
        super(params);
    }
    Draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.filter = this.filter;
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.ParseStyle(ctx, this.fillStyle);
        ctx.strokeStyle = this.ParseStyle(ctx, this.strokeStyle);
        ctx.lineWidth = this.strokeWidth;
        ctx.beginPath();
        ctx.rect(-this._width / 2, -this._height / 2, this._width, this._height);
        ctx.fill();
        if(this.strokeWidth > 0) ctx.stroke();
        ctx.restore();
    }
}

export class Circle extends Drawable {
    constructor(params) {
        super(params);
        this._radius = this._params.radius;
        this._width = this._radius * 2;
        this._height = this._radius * 2;
    }
    get radius() {
        return this._radius;
    }
    set radius(val) {
        this._radius = val;
        this._width = this._radius * 2;
        this._height = this._radius * 2;
        this._ComputeVertices();
    }
    Draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.filter = this.filter;
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.fillStyle = this.ParseStyle(ctx, this.fillStyle);
        ctx.strokeStyle = this.ParseStyle(ctx, this.strokeStyle);
        ctx.lineWidth = this.strokeWidth;
        ctx.beginPath();
        ctx.arc(0, 0, this._radius, 0, 2 * Math.PI);
        ctx.fill();
        if(this.strokeWidth > 0) ctx.stroke();
        ctx.restore();
    }
}

export class Polygon extends Drawable {
    constructor(params) {
        super(params);
        this._points = this._params.points;
    }
    GetVertices() {
        return this._points.map((v) => new Vector(v[0], v[1]));
    }
    Draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.filter = this.filter;
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.fillStyle = this.ParseStyle(ctx, this.fillStyle);
        ctx.strokeStyle = this.ParseStyle(ctx, this.strokeStyle);
        ctx.lineWidth = this.strokeWidth;
        ctx.beginPath();
        for(let i = 0; i < this._vertices.length; ++i) {
            const v = this._vertices[i];
            if(i == 0) ctx.moveTo(v.x, v.y);
            else ctx.lineTo(v.x, v.y);
        }
        ctx.closePath();
        ctx.fill();
        if(this.strokeWidth > 0) ctx.stroke();
        ctx.restore();
    }
}

export class Sprite extends Drawable {
    constructor(params) {
        super(params);
        this._anims = new Map();
        this._currentAnim = null;
        this._paused = true;
        this._framePos = {x: 0, y: 0};
    }
    AddAnim(n, frames) {
        this._anims.set(n, frames);
    }
    PlayAnim(n, rate, repeat, OnEnd) {
        if(this.currentAnim == n) { return; }
        this._paused = false;
        const currentAnim = {
            name: n,
            rate: rate,
            repeat: repeat,
            OnEnd: OnEnd,
            frame: 0,
            counter: 0
        }
        this._currentAnim = currentAnim;
        this._framePos = this._anims[currentAnim.name][currentAnim.frame];
    }
    Reset() {
        if(this._currentAnim) {
            this._currentAnim.frame = 0;
            this._currentAnim.counter = 0;
        }
    }
    Pause() {
        this._paused = true;
    }
    Resume() {
        if(this._currentAnim) {
            this._paused = false;
        }
    }
    Update(timeElapsed) {
        if(this._paused) {
            return;
        }
        const currentAnim = this._currentAnim;
        const frames = this._anims.get(currentAnim.name);
        currentAnim.counter += timeElapsed * 1000;
        if(currentAnim.counter >= currentAnim.rate) {
            currentAnim.counter = 0;
            ++currentAnim.frame;
            if(currentAnim.frame >= frames.length) {
                currentAnim.frame = 0;
                if(currentAnim.OnEnd) {
                    currentAnim.OnEnd();
                }
                if(!currentAnim.repeat) {
                    this._currentAnim = null;
                    this._paused = true;
                }
            }
            this._framePos = frames[currentAnim.frame];
        }
    }
    get currentAnim() {
        if(this._currentAnim) {
            return this._currentAnim.name;
        }
        return null;
    }
    Draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = this.mode;
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(this.flip.x ? -this.scale: this.scale, this.flip.y ? -this.scale : this.scale);
        ctx.rotate(this.angle);
        ctx.drawImage(
            this._params.image,
            this._framePos.x * this._params.frameWidth, this._framePos.y * this._params.frameHeight, this._params.frameWidth, this._params.frameHeight,  
            -this._width / 2, -this._height / 2, this._width, this._height
        );
        ctx.restore();
    }
}