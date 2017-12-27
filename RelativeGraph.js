/**
 * 力导向图，开发框架。基于D3 v3 版本
 */

import TreeItem from './painters/TreeItem';
import NetItem from './painters/NetItem';
import NodeItem from './painters/NodeItem';
import LinkItem from './painters/LinkItem';

import * as Util from './Util';

import Renderer, {groupItem} from './Renderer';

const forceConfigList = ['size', 'friction', 'charge', 'chargeDistance', 'linkDistance', 'theta', 'gravity', 'linkStrength', 'alpha'];

/**
 * option
 * @param {domElement or dom id} container
 * @param {Object} force force布局的配置
 */
const defaultOption = {
    container: '',
    // 已经是很自由的链接配置方式了，除非需要统一节点间的距离，不然不需要修改
    linkDistance: function(link) {
        const distance = (link.source.linkDistance || link.source.constructor.linkDistance || 0) + (link.target.linkDistance || link.target.constructor.linkDistance || 0);
        return distance <= 20 ? 20 : distance;
    },
    linkStrength: function(link) {
        const strength = (link.source.linkStrength || link.source.constructor.linkStrength || 0.5) + (link.target.linkStrength || link.target.constructor.linkStrength || 0.5);
        return strength;
    },
    charge: function(node) {
        return node.charge || node.constructor.charge || -30;
    },
    friction: 0.9,
    theta: 0.8,
    gravity: 0
};

class RelativeGraph {
    constructor(option) {
        option = Object.assign({}, defaultOption, option);
        const wrapper =  d3.select(option.container);

        if(wrapper.empty()) {
            throw new Error('can not find a container to build relative graph');
        }
        const container = wrapper.append('div').style({
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
        });

        const stage = container.append('div').style({...Util.styleLeftTop});
        const svg = stage.append('svg').style({...Util.styleLeftTop, zIndex: 0});
        const html = stage.append('div').style({...Util.styleLeftTop, zIndex: 1});
        const tooltip = container.append('div').style({...Util.styleLeftTop, zIndex: 2});

        const force = d3.layout.force();
        forceConfigList.forEach(k => {
            if(option.hasOwnProperty(k)) {
                force[k](option[k]);
            }
        });

        Object.assign(this, {
            wrapper: wrapper,
            container: container,
            stage,
            svg: svg,
            html: html,
            tooltip: tooltip,
            force: force,
            event: $(this),
            rootGroup: svg.append('g'),
            option
        });
        this.resize();
    }

    resize() {
        const wrapperDom = this.wrapper.node();
        const containerWidth = wrapperDom.clientWidth;
        const containerHeight = wrapperDom.clientHeight;

        const svgWidth = 2e4;
        const svgTranslate = [(containerWidth - svgWidth) / 2, (containerHeight - svgWidth) / 2];
        const htmlTranslate = [containerWidth / 2, containerHeight / 2];
        this.svg.style({width: svgWidth, height: svgWidth, transform: `translate(${svgTranslate[0]}px, ${svgTranslate[1]}px)`});

        if(this.option.gravity === 0) {
            this.rootGroup.attr('transform', `translate(${htmlTranslate[0] - svgTranslate[0]} ${htmlTranslate[1] - svgTranslate[1]})`);
            this.html.style('transform', `translate(${htmlTranslate[0]}px, ${htmlTranslate[1]}px)`);
            this.origin = [0, 0];
        } else {
            this.rootGroup.attr('transform', `translate(${-svgTranslate[0]} ${-svgTranslate[1]})`);
            this.origin = [containerWidth / 2, containerHeight / 2];
        }
        // Todo: scale 生成
        if(!this.option.hasOwnProperty('size')) {
            this.force.size([containerWidth, containerHeight]);
        }
    }

    destroy() {
        this.force.stop();
        this.container.remove();
        this.event.off();
        Object.keys(this).forEach(k => {
            this[k] = null;
        });
    }

    stageCenterTo(x, y, duration = 300) {
        if(Array.isArray(x)) {
            duration = y || 300;
            [x, y] = x;
        }
        this.stage.transition().duration(duration).style({
            left: `${-x}px`,
            top: `${-y}px`
        });
    }

    dragStage() {
        const dragBehavior = d3.behavior.drag();
        const stage = this.stage;

        dragBehavior.on('drag', function() {
            let left = parseInt(stage.style('left').replace(/px$/, ''), 10);
            let top = parseInt(stage.style('top').replace(/px$/, ''), 10);
            left += d3.event.dx;
            top += d3.event.dy;
            stage.style({
                left: left + 'px',
                top: top + 'px'
            });
        });

        this.container.call(dragBehavior);
    }

    undragStage() {
        this.container.on('.drag', null);
    }

    startZoom() {
        
    }

    stopZoom() {

    }

    /**
     * 绘制关系图
     * @param {Array[Object]} nodes 
     * @param {Array[Object]} links 
     * 
     * node 格式
     * {
     *      x, 节点的x坐标
     *      y, 节点的y坐标
     *      px, 节点前一次tick的x坐标
     *      py, 节点前一次tick的y坐标
     *      index, 节点的数组下标
     *      fixed, 是否固定节点：即该节点不参与力计算
     *      weight: 权重
     *      以上是d3 力导向图的原始数据
     * 
     *      以下为本框架自定义的数据
     *      id
     *      model: 原始的业务数据,
     *      type: 节点的类型(主要用于选择使用什么模块来渲染节点)
     * }
     * 
     * link 格式
     *      source 源节点
     *      target 目标节点
     *      
     *      其它具体类型需要的数据
     *      model 业务数据 例如同向多条边的情况(当然是需要提前处理的)
     *      type 边类型（决定渲染方法）
     */
    render(nodes, links) {
        const force = this.force;
        force.stop();

        const renderGroups = groupItem(nodes, links);

        _buildRenderers(this, renderGroups);

        this._renderers.forEach(renderer => {
            const rendrerGroup = renderGroups[renderer.name];
            const items = rendrerGroup ? rendrerGroup.items : [];
            const enterSelections = renderer.renderItems(items);
            _bindGlobalItemEvents(this, enterSelections);
        });

        _clearEmptyRenderer(this);

        // 更新每个节点的信息数据
        this._renderers.forEach(renderer => {
            renderer.update();
        });

        // 注册tick;
        force.nodes(nodes).links(links).on('tick', () => {
            this._renderers.forEach(renderer => {
                renderer.tick();
            });
        });
        force.start();
    }

}
export default RelativeGraph;
RelativeGraph.NodeItem = NodeItem;
RelativeGraph.NetItem = NetItem;
RelativeGraph.TreeItem = TreeItem;
RelativeGraph.LinkItem = LinkItem;

RelativeGraph.Util = Util;

function _buildRenderers(graph, renderGroups) {
    let _renderers = graph._renderers;
    if(!_renderers) {
        _renderers = [];
    }
    const renderersToAdd = [];

    Object.keys(renderGroups).forEach(renderName => {
        const painter = renderGroups[renderName].painter;
        if(!_renderers.find(renderer => renderer.name === renderName)) {
            renderersToAdd.push(new Renderer(graph, painter));
        }
    });

    // 这样子并不能根本性解决svg 排序覆盖的问题
    graph._renderers = _renderers.concat(renderersToAdd).sort((a, b) => {
        return (a.painter.zIndex >> 0) > (b.painter.zIndex >> 0);
    });

    return graph._renderers;
}

function _clearEmptyRenderer(graph) {
    graph._renderers = graph._renderers.filter(renderer => !renderer.isEmpty());
}

function _bindGlobalItemEvents(graph, selections) {
    selections.forEach(function(selection) {
        selection.on('click.global', function (data) {
            const srcElement = this;
            graph.event.triggerHandler('itemClick', [data, srcElement]);
        });
    });
}
