import { paramParser } from "../utils/ParamParser.js";
import { QuadTree } from "../utils/Quadtree.js";
import { Component } from "../core/Component.js";
import { Ray, detectCollision } from "./Body.js";

/**
 * 
 * @typedef {Object} WorldParams
 * @property {number} params.relaxationCount
 * @property {number} params.gravity
 * @property {number[][]} params.bounds
 * @property {{ width:number, height: number }} params.cellDimension
 * @property {number} params.cellLimit
 */

export class World {

    _relaxationCount;
    _gravity;
    /** @type {QuadTree} */
    _quadtree;
    /** @type {Body[]} */
    _bodies = [];
    /** @type {Joint[]} */
    _joints = [];

    /**
     * 
     * @param {WorldParams} params 
     */    
    constructor(params = {}) {

        this._relaxationCount = paramParser.parseValue(params.relaxationCount, 3);
        this._gravity = paramParser.parseValue(params.gravity, 0);

        const bounds = paramParser.parseValue(params.bounds, [[-1000, -1000], [1000, 1000]]);
        const cellDimension = paramParser.parseObject(params.cellDimension, { width: 100, height: 100 });
        const cellLimit = paramParser.parseValue(params.cellLimit, 10);
        
        this._quadtree = new QuadTree(bounds, cellLimit);
        
    }

    get quadtree() {
        return this._quadtree;
    }

    addJoint(j) {
        this._joints.push(j);
    }

    addBody(e, b) {
        e._body = b;
        const treeController = new QuadtreeController({
            quadtree: this._quadtree
        });
        e.addComponent(treeController);
        this._bodies.push(b);
    }

    removeBody(e, b) {
        const i = this._bodies.indexOf(b);
        if (i != -1) {
            this._bodies.splice(i, 1);
        }
    }

    update(elapsedTimeS) {
        for(let body of this._bodies) {
            body._collisions.left.clear();
            body._collisions.right.clear();
            body._collisions.top.clear();
            body._collisions.bottom.clear();
            body._collisions.all.clear();
        }
        for(let body of this._bodies) {
            if(body.mass != 0) {
                body.velocity.y += this._gravity * elapsedTimeS;
            }
            body.updatePosition(elapsedTimeS);
        }
        for(let joint of this._joints) {
            joint.update(elapsedTimeS);
        }
        for(let i = 0; i < this._relaxationCount; ++i) {
            for(let body of this._bodies) {
                body.handleBehavior();
            }
        }
        this._quadtree.clear();
        for(let body of this._bodies) {
            const treeController = body.getComponent("QuadtreeController");
            treeController.updateClient();
        }
        
    }

    raycast(params) {
        let result = [];

        const groups = params.groups.split(" ");

        const ray = new Ray({
            range: params.range
        });
        ray.position = params.position;
        ray.angle = params.angle;

        const rayBox = ray.getBoundingRect();

        const bodies = this._bodies.filter((b) => {
            if(!groups.map((g) => b.parent.groupList.has(g)).some(_ => _)) {
                return false;
            }
            const bodyBox = b.getBoundingRect();
            return (ray.position.x + rayBox.width / 2 - (b.position.x - bodyBox.width / 2) ) * (ray.position.x - rayBox.width / 2 - (b.position.x + bodyBox.width / 2) ) < 0 ||
            (ray.position.y + rayBox.height / 2 - (b.position.y - bodyBox.height / 2) ) * (ray.position.y - rayBox.height / 2 - (b.position.y + bodyBox.height / 2) ) < 0;
        });

        for(let b of bodies) {
            let info = detectCollision(ray, b);
            if(info.collide) {
                result.push({
                    body: b,
                    point: info.point
                });
            }
        }
        return result;
    }
    
}

export class QuadtreeController extends Component {

    _quadtree;
    _client = null;

    constructor(params) {
        super();
        this._quadtree = params.quadtree;
    }

    initComponent() {
        const pos = [
            this._parent.body.position.x,
            this._parent.body.position.y
        ];
        const boundingRect = this._parent.body.getBoundingRect();
        this._client = this._quadtree.newClient(pos, [boundingRect.width, boundingRect.height]);
        this._client.entity = this._parent;
    }

    findNearby(rangeX, rangeY) {
        const results = this._quadtree.findNear(
            [this._parent.position.x, this._parent.position.y], [rangeX, rangeY]
        );
        return results.filter(c => c.entity != this._parent).map(c => c.entity);
    }

    updateClient() {
        const pos = [
            this._parent.body.position.x,
            this._parent.body.position.y
        ];
        this._client.x = pos[0];
        this._client.y = pos[1];
        if(this._parent.body._resized) {
            this._parent.body._resized = false;
            const boundingRect = this._parent.body.getBoundingRect();
            this._client.w = boundingRect.width;
            this._client.h = boundingRect.height;
        }
        this._quadtree.updateClient(this._client);
    }
}