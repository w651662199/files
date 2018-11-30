# initState

initState 方法主要是对 props、methods、data、computed 和 wathcer 等属性做了初始化操作。

initState 的代码将各个属性的初始化拆分成各个功能块。下面我们一个一个的看看。

## initProps

props 的初始化主要过程，就是遍历定义的 props 配置。遍历的过程主要做两件事情：一个是调用 defineReactive 方法把每个 prop 对应的值变成响应式，可以通过 vm.\_props.xxx 访问到定义 props 中对应的属性。对于 defineReactive 方法，我们稍后会介绍；另一个是通过 proxy 把 vm._props.xxx 的访问代理到 vm.xxx 上。

`if (opts.props) initProps(vm, opts.props)`当实例属性中存在props属性时，就会调用initProps方法。

```
  const propsData = vm.$options.propsData || {}
```
propsData 拿到props对应的值。这里之前在看_init时，如果是组件会执行一段代码
```
  //initInternalComponent
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
```
此时propsData里就是存的对应的真实值。
看个例子
```
//html
  <div id="app"><c-m :name="name" :flag="flag"></c-m></div>
//script
  var vm = new Vue({
    el: '#app',
    data: {
      name: 'test provie',
      flag: true
    },
    components: {
      'c-m': cvm //子组件的定义此处省略，就是最简单的那种
    }
  });
```
我们打下断点看下propsData的值

![propsData](./img/initState01.png)

这样是不是就清晰了。

`const props = vm._props = {}`这里在实例上添加了_props属性，并将props变量指向它。

```
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  const keys = vm.$options._propKeys = []
```
这行代码，根据作者注释可以知道，在实例的选项上定义_propKeys数组，以便将来更新时可以使用数组的方式替代动态对象枚举进行迭代的方式，更方便了。
`const isRoot = !vm.$parent`判断当前实例是否为顶级根元素。如果不是根元素的话暂时禁用观察。

接下来是循环遍历每个props选项
`keys.push(key)`将每项写key存入_propKeys中。
`const value = validateProp(key, propsOptions, propsData, vm)`取到选项的值，然后为选项实现响应式，主要是defineReactive方法。

最后
```
  if (!(key in vm)) {
    proxy(vm, `_props`, key)
  }
```
通过proxy，将_props.xxx的访问代理到vm.xxx上。

## initMethods

initMethods方法比较简单，将options中的method添加为当前实例的方法，并绑定方法的上下文（this）.
`vm[key] = methods[key] == null ? noop : bind(methods[key], vm)`

## initData

data 的初始化主要过程是做两件事，一个是对定义 data 函数返回对象的遍历，通过 proxy 把每一个值 vm._data.xxx 都代理到 vm.xxx 上；另一个是调用 observe 方法观测整个 data 的变化，把 data 也变成响应式，可以通过 vm._data.xxx 访问到定义 data 返回函数中对应的属性。

