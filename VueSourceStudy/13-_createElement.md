# _createElement

由于源码过多，我们就不贴整段代码了，直接拆分来看。

```
  if (isDef(data) && isDef((data: any).__ob__)) {
    process.env.NODE_ENV !== 'production' && warn(
      `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
      'Always create fresh vnode data objects in each render!',
      context
    )
    return createEmptyVNode()
  }
```
如果data不为undefined或null，并且data中有\_\_ob__属性，如果是非生产环境抛出警告：避免使用被监听的数据对象作为节点数据，应该始终在每个渲染中创建新的vnode数据对象。

这里\_\_ob__是在为数据实现监听时添加的属性。

```
export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}
```
创建一个空的虚拟dom，标记为注释，并返回。

```
  // object syntax in v-bind
  if (isDef(data) && isDef(data.is)) {
    tag = data.is
  }
```
根据注释：v-bind中的对象语法。在动态组件中使用，不清楚的可以查阅官方文档。
将is指向的组件赋值给tag

```
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
```
当tag没有值时，返回一个空节点。
```
  // warn against non-primitive key
  if (process.env.NODE_ENV !== 'production' &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    if (!__WEEX__ || !('@binding' in data.key)) {
      warn(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead.',
        context
      )
    }
  }
```
这里检查组件的key值，如果是对象等类型，警告使用string或number类型的值作为key