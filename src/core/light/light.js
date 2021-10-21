import { Component } from "../component.js";
import { ParamParser } from "../utils/param-parser.js";
import { StyleParser } from "../utils/style-parser.js";

export class AmbientLight {
    constructor(params) {
        this._color = ParamParser.ParseValue(params.color, "white");
        this._colorCache = null;
    }
    get color() {
        return this._color;
    }
    set color(col) {
        this._color = col;
        this._colorCache = null;
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = StyleParser.ParseStyle(ctx, this.color, this, "_colorCache");
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

export class RadialLight extends Component {
    constructor(params) {
        super();
        this._type = "light";
        this._color = ParamParser.ParseValue(params.color, "white");
        this.radius = ParamParser.ParseValue(params.radius, 100);
        this.angle = 0;
        this.angleRange = ParamParser.ParseValue(params.angleRange, Math.PI * 2);
        this._colorCache = null;
    }
    get color() {
        return this._color;
    }
    set color(col) {
        this._color = col;
        this._colorCache = null;
    }
    Draw(ctx) {
        ctx.beginPath();
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = StyleParser.ParseStyle(ctx, this.color, this, "_colorCache");
        ctx.arc(0, 0, this.radius, -this.angleRange/2, this.angleRange/2);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}