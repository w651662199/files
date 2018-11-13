# initRender

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


