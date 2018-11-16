# initRender

该方法是定义组件渲染时用到的方法和属性。

这个方法的注释比较多，就不贴整段代码了，我们直接一句一句的拆着看吧。

```
vm._vnode = null // the root of the child tree
```
根据注释可以得知，在实例上定义_vnode，为子树的根

```
vm._staticTrees = null // v-once cached trees
```
只渲染一次的树的缓存

```
const options = vm.$options
```
将实例的$options选项赋值给options。

`const parentVnode = vm.$vnode = options._parentVnode`

将options中的_parentVnode赋值给$vnode和怕人TVnode。

`const renderContext = parentVnode && parentVnode.context`

parentVnode是否存在，如果存在，则把parentVnode.context赋值给renderContext。

```
vm.$slots = resolveSlots(options._renderChildren, renderContext)
```
这里用到了resolveSlots方法，可以去看另一篇学习笔记，有该方法的代码解读。
这里就直接略过了。
继续往下看
```
vm.$scopedSlots = emptyObject
```
这里emptyObject是一个空对象，是Object.freeze({})创建的，不清楚该方法的同学请自行查阅。

```
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
```
这句话作者给出了注释，将createElement方法绑定到实例上，这样我们就行在方法内获得正确的渲染上下文了。
让后给出了参数：标签，数据，子组件，规范化类型，是否规范化
最后一句注释：内部版本被从模板编译来的渲染函数使用。（对这句注释还不太清楚，后续明白后再来补充）

```
  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
```
同样，这里将createElement绑定到了实例的$createElement上，只不过这里的alwaysNormalize默认传参为true。根据作者注释‘规范化始终适用于公共版本，也就是用户写的render方法’

写到这里，我们知道在使用vue组件时，我们可以自己写render方法，render函数默认传参就是createElement，这里应该是$createElement这个方法。
createElement方法的具体实现，我们会单独讲解，这里就继续往下看了。

```
  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  const parentData = parentVnode && parentVnode.data
```
作者的注释：为了更简单的创建HOC，暴露$attrs 和 $listeners，这两个属性需要是响应的，这样才可以保证在HOC中使用的是最新的。
看到这，对HOC一脸茫然啊，在之前开vue的官方文档时，并没有见过这个词啊，难度是我少看了？于是乎官网有从头看了一遍，还是没有发现，没办法，Google吧。原来是高阶组件（Higher-Order Components）的缩写，这个具体的内容建议大家还是自行Google吧，以防在此误导大家。

接下来的代码就是将$attrs 和 $listeners实现响应式的代码
```
  if (process.env.NODE_ENV !== 'production') {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm)
    }, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm)
    }, true)
  } else {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
  }
```
这里主要用到了defineReactive方法，这个方法定义在/src/core/observer路径下，该路径下是实现数据双向绑定的核心代码。所以我们也将单独说说。

上边区分了生产环境和非生产环境，在非生产环境时如果isUpdatingChildComponent为false是修改$attrs和$listeners时发出警告，属性为只读属性，具体使用可以到defineReactive方法解读里查看。

到此initRrender就讲完了。