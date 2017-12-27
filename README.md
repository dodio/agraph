# agraph
一个图谱开发框架，方便你开发自己业务图谱。

# 依赖
全局引入的d3-v3版本


#使用方式
我基本不发布npm，所以就建议你直接clone回去，放到你的某个目录。
然后这样开始：
``` js
import RelativeGraph from './RelativeGraph';

const graph = new RelativeGraph({
    container: '#graphid'
    // 其它一些force layout 参数
});

```

给你的业务数据定义一个渲染对象，一般你只需要继承 TreeItem 或者 NodeItem 等就可以了。
如
``` js
export default class Person extends RelativeGraph.TreeItem {
    
    static onEnter() {}
    static onTick() {}

    events = {
        click() {
            // do something
        }
    }   
}

```
其中你需要按照 Renderable.js 里定义的规范来实现相关的接口。

``` js
// 调用 graph.render(nodes, links);
就可以进行力导向图的渲染了，事件那些会自动绑定 渲染对象上的 events click等事件
```


#其它

其实这个是最初我用来开发图一个开发范式。
现在已经有新的开发范式，会尽快就发出来。
它叫：Artchart