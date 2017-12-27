import Renderable from '../Renderable';
import { getAnchorPoints, enterItemsFilter } from '../Util';

export default class LinkItem extends Renderable {

    constructor(targetToSource = [], sourceToTarget) {
        super();
        // 传入的是用 Util里的 merge 之类的方法标准化后的边
        if(!Array.isArray(targetToSource) && typeof targetToSource === 'object') {
            this.arrow = true;
            Object.assign(this, targetToSource);
            return;
        }
        
        this.targetToSource = targetToSource;
        if(sourceToTarget === undefined) {
            this.sourceToTarget = [];
            this.arrow = false; // 无向边
        } else if(typeof sourceToTarget === 'boolean') {
            this.sourceToTarget = [];
            this.arrow = sourceToTarget; // 第二个参数定义有向无向
        } else {
            this.sourceToTarget = sourceToTarget;
            this.arrow = true; // 两个参数都指定了，肯定是有向边
        }
    }
    // 将起始节点设置未指定节点
    pointTo(nodeItem) {
        if(!this.haveNode(nodeItem)) {
            return this;
        }
        if(nodeItem !== this.source) {
            this.reverse();
        }
        return this;
    }
    // 检测节点是否属于该边连接
    haveNode(nodeItem) {
        return nodeItem === this.target || nodeItem === this.source;
    }
    // 反转连接方向（并不会反转 sourceToTarget 的边信息）
    reverse() {
        const {
            source: target, 
            target: source, 
            targetToSource: sourceToTarget,
            sourceToTarget: targetToSource
        } = this;

        Object.assign(this, {
            source,
            target,
            targetToSource,
            sourceToTarget
        });
        return this;
    }
    // 获取进入的该节点的边信息
    getArriveLink(nodeItem) {
        if(!this.haveNode(nodeItem)) {
            return null;
        }
        if(this.source === nodeItem) {
            return this.targetToSource;
        }
        return this.sourceToTarget;
    }
    // 获取从该节点出去的边
    getLeaveLink(nodeItem) {
        if(!this.haveNode(nodeItem)) {
            return null;
        }
        if(this.source === nodeItem) {
            return this.sourceToTarget;
        }
        return this.targetToSource;
    }
    // 获取所有的边
    getLinks() {
        return this.sourceToTarget.concat(this.targetToSource);
    }
    // 获取一条边
    getLink() {
        return this.getLinks()[0];
    }

    // 是否是空链接（就是实际上没有链接内容，强行加的链接）
    isEmpty() {
        return !this.sourceToTarget.length && !this.targetToSource.length;
    }
    
    /**
     * 以下实例函数主要作用是绘图使用
     */
    
    // 获取线两端节点的挂载点，以下方法都会基于线两端的挂载点位置来计算
    getAnchorPoints() {
        return getAnchorPoints(this);
    }

    // 获取从target 到 source 的向量
    getVector() {
        const [sourcePoint, targetPoint] = this.getAnchorPoints();
        return [targetPoint[0] - sourcePoint[0], targetPoint[1] - sourcePoint[1]];
    }
    // 获取节点连线的中间点
    getMiddlePoint() {
        const [sourcePoint, targetPoint] = this.getAnchorPoints();
        let x = (sourcePoint[0] + targetPoint[0]) / 2;
        let y = (sourcePoint[1] + targetPoint[1]) / 2;
        return [x, y];
    }
    
    // 获取方向角
    getAngle() {
        let v = this.getVector();
        return Math.atan(v[1] / v[0]);
    }

    // 获取法向量
    getVertical() {
        
    }

    static onEnter({svg, html}) {
        const svgSelection = svg.append('path').attr('stroke', '#0ba951');
        enterItemsFilter(html, (d) => d.linkText !== undefined);
        const htmlSelction = html.append('div').text(d => d.linkText);
        return [svgSelection, htmlSelction];
    }

    static onUpdate() {
        return;
    }

    static onTick(opt) {
        opt.selection.svg.attr('d', function(link) {
            const line = d3.svg.line();
            return line(getAnchorPoints(link));
        });
        opt.selection.html.each(function(d) {
            const middle = d.getMiddlePoint();
            d3.select(this).style({
                left: middle[0] + 'px',
                top: middle[1] + 'px'
            });
        });
    }
}