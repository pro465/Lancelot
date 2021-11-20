export class Renderer {

    _width;
    _height;
    _aspect;
    _scale;
    _parentElement;
    _container;
    _canvas;
    _context;

    constructor(width, height, parentElement = document.body) {
        this._width = width;
        this._height = height;
        this._parentElement = parentElement;
        this._aspect = this._width / this._height;
        this._scale = 1.0;
        this._buffers = [];

        for(let i = 0; i < 5; ++i) {
            const b = document.createElement("canvas").getContext("2d");
            b.canvas.width = this._width;
            b.canvas.height = this._height;
            b.imageSmoothingEnabled = false;
            this._buffers[i] = b;
        }

        this._initContainer();
        this._initCanvas();
        this._onResize();

        window.addEventListener("resize", () => this._onResize());
    }

    get canvas() {
        return this._canvas;
    }

    render(scenes) {

        const ctx = this._context;

        ctx.beginPath();
        ctx.clearRect(0, 0, this._width, this._height);

        const draw = (ctx, sceneIndex, bufferIndex) => {

            const scene = scenes[sceneIndex];
            if(!scene) {
                return;
            }
            if(scene.hidden) {
                draw(ctx, sceneIndex + 1, bufferIndex);
                return;
            }

            const w = this._width;
            const h = this._height;
            
            scene.drawLights(ctx, w, h);

            if(!this._buffers[bufferIndex]) {
                const b = document.createElement("canvas").getContext("2d");
                b.canvas.width = w;
                b.canvas.height = h;
                this._buffers[bufferIndex] = b;
            }

            const b = this._buffers[bufferIndex];
            if(sceneIndex < scenes.length - 1) {
                draw(b, sceneIndex + 1, bufferIndex + 1);
                b.globalCompositeOperation = "source-over";
            }
            scene.drawObjects(b, w, h);

            ctx.drawImage(b.canvas, 0, 0);

        }

        draw(ctx, 0, 0);

    }

    displayToSceneCoords(scene, x, y) {
        const boundingRect = this._canvas.getBoundingClientRect();
        const scaledX = (x - boundingRect.x) / this._scale;
        const scaledY = (y - boundingRect.y) / this._scale;
        const cam = scene.camera;
        return {
            x: (scaledX - this._width / 2) / cam.scale + cam.position.x,
            y: (scaledY - this._height / 2) / cam.scale + cam.position.y
        };
    }

    _initContainer() {
        const con = this._container = document.createElement("div");

        con.style.width = this._width + "px";
        con.style.height = this._height + "px";
        con.style.position = "relative";
        con.style.left = "50%";
        con.style.top = "0%";
        con.style.transformOrigin = "center";

        this._parentElement.appendChild(con);
    }

    _initCanvas() {
        const cnv = this._canvas = document.createElement("canvas");

        cnv.width = this._width;
        cnv.height = this._height;
        this._context = cnv.getContext("2d");

        cnv.style.position = "absolute";
        cnv.style.left = "0";
        cnv.style.top = "0";
        cnv.style.display = "block";
        cnv.style.background = "black";

        this._container.appendChild(cnv);
    }

    _onResize() {
        const [width, height] = [this._parentElement.clientWidth, this._parentElement.clientHeight];
        if(width / height > this._aspect) {
            this._scale = height / this._height;
        } else {
            this._scale = width / this._width;
        }
        this._container.style.transform = "translate(-50%, calc(-50% + " + (this._height / 2 * this._scale) + "px)) scale(" + this._scale + ")";
        this._context.imageSmoothingEnabled = false;
    }
}