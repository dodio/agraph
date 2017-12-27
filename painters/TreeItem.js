import NodeItem from './NodeItem';

export default class TreeItem extends NodeItem {
    constructor(model, parent, id) {
        super(model, id);
        this.parentLink = null; // 与父节点连接的 linkItem;

        this.parent = parent; // 氟元素
        this.children = []; // 子元素

        this.hide = false; // 是否隐藏自己
        this.hideChildren = false; // 是否隐藏子元素
        return this;
    }

    renderTo(graph) {
        const nodes = flatten(this);
        const links = [];
        nodes.forEach(parent => {
            parent.children  && !parent.hideChildren && parent.children.forEach(child => {
                if(child.hide) {
                    return;
                }
                let linkItem = child.parentLink;
                linkItem.source = child.index;
                linkItem.target = parent.index;
                links.push(linkItem);
            });
        });
        graph.render(nodes, links);
    }
}

function flatten(root) {
    let nodes = [], i = 0;
    function recurse(node) {
        if(node.hide) {
            return;
        }
        node.index = i++;
        nodes.push(node);
        if (!node.hideChildren && node.children && node.children.length) {
            node.children.forEach(recurse);
        }
    }
    recurse(root);
    return nodes;
}