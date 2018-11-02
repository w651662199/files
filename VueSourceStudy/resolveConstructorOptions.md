# resolveConstructorOptions

此方法有两种情况，一是通过Vue构造函数创建的实例，还有一种是通过Vue.extend创建的实例
```
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  // 有super说明Ctor是通过extend构建的子类
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}
```

## ctor是基础Vue构造器
ctor.options的结构如下图
![Vue.options](./img/vueOptions.png 'vue 构造器options')

此时到这里，我们并没有看到过这几个选项，构造器里也没有设置，那么是在哪设置的呢？

```
  // src/core/index.js
  import Vue from './instance/index'
  import { initGlobalAPI } from './global-api/index'
  import { isServerRendering } from 'core/util/env'
  import { FunctionalRenderContext } from 'core/vdom/create-functional-component'

  initGlobalAPI(Vue)

  // src/core/global-api/index.js
  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue

  // Vue.options.components添加KeepAlive属性
  extend(Vue.options.components, builtInComponents)

  // src/shared/constants.js
  export const ASSET_TYPES = [
    'component',
    'directive',
    'filter'
  ]

  // src/platforms/web/runtime/index.js
  // Vue.options.directives添加model,show属性
  extend(Vue.options.directives, platformDirectives)
  // Vue.options.components添加Transition,TransitionGroup属性
  extend(Vue.options.components, platformComponents)
```

通过上述代码Vue构造函数的options对象就生成了。
下面引用一张网上的图片
![options init](./img/vueOptions02.png)

