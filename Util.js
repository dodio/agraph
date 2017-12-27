/**
* 获取根据弧两端节点的锚点配置，获取弧的实际连接点.
*/
export function getAnchorPoints(link) {
    const {source, target} = link;
    const p1 = [source.x, source.y];
    const p2 = [target.x, target.y];
    const sourcePainter = source.constructor, 
        targetPainter = target.constructor;

    const sourceAnchors = Object.assign({default: p1}, sourcePainter.getAnchors(source)),
        tagetAnchors = Object.assign({default: p2}, targetPainter.getAnchors(target)),

        sourcePoint = sourceAnchors[targetPainter.link[sourcePainter.name]] || sourceAnchors['default'],
        targetPoint = tagetAnchors[sourcePainter.link[targetPainter.name]] || tagetAnchors['default'];
        
    return [sourcePoint, targetPoint];
}

// 对enter() 生成的selection 中的数据进行过滤
export function enterItemsFilter(enterSelection, filter) {
    const items = enterSelection[0].filter(function(d, i) {
        return filter(d.__data__, i);
    }).map(function(d) {
        return d.__data__;
    });
    return replaceEnterItems(enterSelection, items);
}

// 对enter() 生成的selection 数据进行替换
export function replaceEnterItems(enterSelection, items) {
    const old = enterSelection[0];
    const newOne = items.map(function(item) {
        return {
            __data__: item
        };
    });
    newOne.parentNode = old.parentNode;
    newOne.update = old.update;
    newOne.update.length = newOne.length;
    enterSelection[0] = newOne;
    return enterSelection;
}

export const styleLeftTop = {
    position: 'absolute',
    top: '0',
    left: '0'
};

// 获取当前事件的鼠标页面坐标
export function getMousePoint() {
    return [d3.event.sourceEvent.pageX, d3.event.sourceEvent.pageY];
}

// TODO
export function contextmenu(data, obj) {
    const tooltip = opt.getToolTip();
    const tipDom = tooltip.node();
    tipDom.showingContextMenu = true;
    $(tipDom).hide();
    tooltip.html(`<div class="contextmenu">
        <a href="javascript:" class="jointanxun">加入探寻</a>
    </div>`);
    let offset = d3.mouse(opt.container);
    tooltip.style({
        left: `${offset[0]}px`,
        top: `${offset[1]}px`
    });
    showToolTip();
    function showToolTip() {
        $(tipDom).on('click', '.jointanxun', function() {
            addTanxu(data.model);
        }).show(300);
        $(document).on('click', hideTooltip);
    }
    function hideTooltip() {
        $(tipDom).off('click').hide(300, function(){
            tipDom.showingContextMenu = false;
        });
        $(document).off('click', hideTooltip);
    }
    d3.event.preventDefault();
}

export function mergeLink(links, sourceKey, targetKey) {
    const groupLink = {}; // 先把边按照startId 或 endId 成对进行归类 o 复杂度

    links.forEach(link => {
        const sourceId = link[sourceKey];
        const targetId = link[targetKey];
        const sourceToTargetId = sourceId + '_' + targetId;
        const targetToSourceId = targetId + '_' + sourceId;
        let group = groupLink[sourceToTargetId] || groupLink[targetToSourceId];
        if (!group) {
            group = groupLink[sourceToTargetId] = {
                source: sourceId,
                target: targetId,
                sourceToTarget: [],
                targetToSource: []
            };
        }
        if(group.sourceId === sourceId) {
            group.sourceToTarget.push(link);
        } else {
            group.targetToSource.push(link);
        }
    });
    const mergedLinks = Object.values(groupLink);

    return mergedLinks;
}

// 反转link的source和target，因为在上面合并的时候，
// 并不能保证无向边中的 source 和 target 是想要的代码顺序
export function reverseLink(link) {
    const {
        source: target, 
        target: source, 
        targetToSource: sourceToTarget,
        sourceToTarget: targetToSource
    } = link;
    return {
        source,
        target,
        targetToSource,
        sourceToTarget
    };
}

// 把边数组中的source target 变成 nodes 数组中的index
export function indexLink(nodes, links, nodeKey) {
    if(!nodeKey) {
        throw new Error('you need pass a key to know how to link nodes;');
    }
    const nodeIdMap = {};
    nodes.forEach((n, i) => {
        const id = typeof nodeKey === 'function' ? nodeKey(n) : n[nodeKey];
        nodeIdMap[id] = i;
    });

    return links.map(link => {
        return {
            ...link,
            source: nodeIdMap[link.source],
            target: nodeIdMap[link.target]
        };
    });
}

// 点间距离
export function distance(p1, p2) {
    let dx = Math.abs(p1[0] - p2[0]);
    let dy = Math.abs(p1[1] - p1[2]);
    return Math.sqrt(Math.pow(dx, 2), Math.pow(dy, 2));
}

export function dragCreator(force){
    return function (arg) {
        
        let fixed, event;

        if(arg !== undefined) {
            if(typeof arg === 'boolean') {
                fixed = arg;
            }
            if(typeof arg === 'object') {
                event = arg;
            }
        }

        const behavior = force.drag();

        behavior.on('dragstart', function(d) {
            d.drag = 'dragstart';
            this.dragStartPoint = getMousePoint();
            this.dragDistance = 0;
            event && typeof event.dragstart === 'function' && event.dragstart.call(this, d);
            d3.event.sourceEvent.preventDefault();
            d3.event.sourceEvent.stopPropagation();
        }).on('drag', function(d) {

            let p1 = this.dragStartPoint;
            let p2 = getMousePoint();
            this.dragDistance = Math.max(this.dragDistance, distance(p1, p2));

            event && typeof event.drag === 'function' && event.drag.call(this, d);
            d3.event.sourceEvent.preventDefault();
            d3.event.sourceEvent.stopPropagation();
        }).on('dragend', function(d) {
            this.dragEndPoint = getMousePoint();
            let p1 = this.dragStartPoint;
            let p2 = this.dragEndPoint;
            this.dragDistance = Math.max(this.dragDistance, distance(p1, p2));
            
            // 因为点击也会触发这个dragend，所以判断大于20像素的移动才算是移动了
            if(fixed !== undefined && this.dragDistance > 20) {
                d.fixed = fixed;
            }

            event && typeof event.dragend === 'function' && event.dragend.call(this, d);
            d3.event.sourceEvent.preventDefault();
            d3.event.sourceEvent.stopPropagation();
        });
        return behavior;
    };
}