import Renderable from '../Renderable';

export default class NodeItem extends Renderable {
    constructor(model, id) {
        super(id);
        this.model = model;
    }

    static onEnter({svg, drag}) {
        return svg.append('circle').style('fill', 'white').attr('r', 15).call(drag());
    }

    static onUpdate(){
        return;
    }

    static onTick(opt) {
        opt.selection.svg.attr('cx', d => d.x).attr('cy', d => d.y);
    }

    static getAnchors(node) {
        return {};
    }
}
