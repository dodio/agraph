import uuid from 'uuid';
/**
 * 所有图形的渲染器基类
 */
export default class Renderable {
    constructor(id) {
        if(this.constructor === Renderable) {
            throw 'you should extend Renderable';
        }
        // 用于d3 dom key
        this.id = id || uuid();
    }

    // 获取该绘图对象的边界
    getBounds() {
        throw new Error('这是默认的getBounds方法，请复写我');
    }
    // 获取该绘图对象的矩形边界
    getRectBounds() {
        throw new Error('这是默认的getRectBounds方法，请复写我');
    }
    /**
     * 定义 如何渲染节点，根据graph 提供过来的工具，可以渲染svg、html、tooltip，后面还可以渲染到canvas
     * @param {*} option 
     * svg()
     * html()
     * tooltip()
     * drag()
     * @return 暂时不需要return啥东西，可能canvas 需要一个 keyShape 用于判断该节点的边界
     */
    // 新增加节点时调用，主要应该做的事是：创建节点的容器选择器
    static onEnter() {
        console.warn('这是默认的渲染器onEnter方法，请复写我');
    }
    // 节点数据更新时调用，主要应该做的事是：更新该节点容器内的内容。
    static onUpdate() {
        // 其实可以不用update 因为item 直接用uuid，多数情况会自动销毁原来的dom，除非同一个节点的model数据会改变
        console.warn('这是默认的更新数据的onUpdate方法，请复写我');
    }
    // 布局变化时，调用更新位置，所以动画应该交给 布局系统去做，由布局系统调用tick来实现图 动画，只是就失去了对单个点的动画效果，这个是个优化的点。
    static onTick() {
        console.warn('这个是默认的更新位置onTick方法，请复写');
    }
    /**
     * 获取锚点，用于边连接地点,返回一个对象
     * {
     *     '描点名': [x, y]
     *     'default': 默认锚点
     * }
     * 如果没有返回锚点，或者或者别的节点类型 挂靠时指定的节点并没有在返回的列表中时，则锚点为本节点默认锚点位置，或节点的中心位置
     * @param {Object[Node]} node 
     */
    static getAnchors(node) {
        console.warn('默认的获取锚点方法，请复写我');
        return {};
    }
    /**
     * 定义锚点连接对应关系
     * {
     *      "对方节点类型": "对方锚点名称"
     * }
     * 如果没有定义对方的节点连接方式，则使用对方的默认锚点
     */
    static link = {}
    static event = {} // 需要绑定的事件
    static zIndex = 1 // 用于 svg图形的排序

    // force 布局的配置
    static linkDistance = 80
    static linkStrength = 0.5
    static charge = -30
}
