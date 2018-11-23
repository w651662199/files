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
这里检查组件的key值，如果是对象等类型，给出警告应该使用string或number类型的值作为key。
```
  // support single function children as default scoped slot
  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {}
    data.scopedSlots = { default: children[0] }
    children.length = 0
  }
```
这里判断children是否为数组，并且第一个元素的类型是否为function，如果是，则将第一个元素转为默认作用域插槽。并将children长度设置为0.

由于 Virtual DOM 实际上是一个树状结构，每一个 VNode 可能会有若干个子节点，这些子节点应该也是 VNode 的类型。_createElement 接收的第 4 个参数 children 是任意类型的，因此我们需要把它们规范成 VNode 类型。
```
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }
```
判断normalizationType的值，如果为‘ALWAYS_NORMALIZE’调用normalizeChildren，如果值为‘SIMPLE_NORMALIZE’则调用simpleNormalizeChildren。
从initRender中我们可以得知，当render函数是编译器生成的时候，调用simpleNormalizeChildren，当render是用户自己写的时候，调用normalizeChildren。
这两个方法下篇细讲。

规范化children后，接下来会去创建一个 VNode 的实例
创建VNode分两种情况，一是当tag为字符串时，另一种是当tag为component类型时。

```
  if (typeof tag === 'string') {
    let Ctor
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children)
  }
```
这里先对 tag 做判断，如果是 string 类型，则接着判断如果是内置的一些节点，则直接创建一个普通 VNode，如果是为已注册的组件名，则通过 createComponent 创建一个组件类型的 VNode，否则创建一个未知的标签的 VNode。 如果是 tag 一个 Component 类型，则直接调用 createComponent 创建一个组件类型的 VNode 节点。对于 createComponent 创建组件类型的 VNode 的过程，我们之后会去介绍，本质上它还是返回了一个 VNode。

