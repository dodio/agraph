import { styleLeftTop, dragCreator } from './Util';

export default class Renderer {
    constructor(graph, painter) {
        this.graph = graph;
        this.name = painter.name;
        this.painter = painter;
        this.items = [];
        this.selection = _getSelection(graph, this);
    }

    renderItems(items = []) {
        this.items = items;
        const graph = this.graph;
        const name = this.name;
        const painter = this.painter;

        const enterSelection = painter.onEnter({
            svg: _createEnter(graph.rootGroup, name, items),
            html: _createEnter(graph.html, name, items),
            drag: dragCreator(graph.force)
        });

        if(!((enterSelection instanceof d3.selection) || (enterSelection instanceof Array && enterSelection.every(s => s instanceof d3.selection) ))) {
            throw new Error('you thould return a d3 selection or an array contains d3 selection');
        }

        const enterSelections = enterSelection instanceof d3.selection ? [enterSelection] : enterSelection;
        
        enterSelections.forEach(enterSelection => {
            if(enterSelection.empty()) {
                return enterSelection;
            }
            enterSelection.each(function(d) {
                d3.select(this).classed(`${name} item`, true);
            });

            if(painter.event) {
                Object.keys(painter.event).forEach(eventType => {
                    const renderer = this;
                    // 给模块绑定事件
                    enterSelection.on(`${eventType}.module`, function (data) {
                        painter.event[eventType].call(this, data, _createOption(renderer));
                    });
                });
            }
        });

        // 更新该组对所有节点的选择器
        this.selection = _getSelection(graph, this);
        return enterSelections;
    }

    // 根据数据去更新节点上的信息
    update() {
        this.painter.onUpdate(_createOption(this));
    }

    // 更新位置信息
    tick() {
        this.painter.onTick(_createOption(this));
    }

    isEmpty() {
        return !this.items.length;
    }

    // 一个类别只有一个toolTip
    getToolTip() {
        const tooltip = this.graph.tooltip;
        const name = this.name;
        tooltip.selectAll('div.tooltip').each(function(d) {
            let _this = d3.select(this);
            if(!_this.classed(name) && !this.hold) {
                _this.style('display', 'none');
            }
        });

        let tip = tooltip.select('div.tooltip.' + name);
        if(tip.empty()) {
            tip = tooltip.append('div').classed(`tooltip ${name}`, true).style({...styleLeftTop, display: 'none'});
        }
        return tip;
    }
}

function _createEnter(container, name, items) {
    const selection = container.selectAll(`.${name}`).data(items, d => d.id);
    selection.exit().remove();
    return selection.enter();
}

/**
 * 获取分组选区信息
 */
function _getSelection(graph, renderer) {
    let name = renderer.name;
    return {
        svg: graph.svg.selectAll(`.${name}`),
        html: graph.html.selectAll(`.${name}`)
    };
}

function _createOption(renderer) {
    return {
        container: renderer.graph.container.node(),
        getToolTip: renderer.getToolTip.bind(renderer),
        items: renderer.items,
        selection: renderer.selection,
        event: renderer.graph.event
    };
}

export function groupItem(nodes, links) {
    const renderGroups = {};
    nodes.concat(links).forEach(n => {
        const renderName = n.constructor.name;
        if (!renderGroups[renderName]) {
            renderGroups[renderName] = {
                name: renderName,
                painter: n.constructor,
                items: []
            };
        }
        renderGroups[renderName].items.push(n);
    });
    return renderGroups;
}
