# initMixin（2）

## _init

```
    Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    // 创建一个 uid,这个uid是唯一的，每新建一个vue实例，id加1
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    // istanbul 是一个代码覆盖率测试工具
    // 该句是测试覆盖率是忽略这个if语句
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      //性能检测打点 参考performance api
      mark(startTag)
    }

    // a flag to avoid this being observed
    // 防止被观察的一个标志位，在新建observer时用到
    vm._isVue = true
    // merge options
    // 合并属性 此处options就是新建vue实例是传入的属性
    // _isComponent 是内部组件时为true
    // 在源码中搜索发现，createComponentInstanceForVnode这个方法里对该选项设置为true，同时还设置了_parentVnode，和parent，所以在单页应用中第一次创建时是false。
    // 即项目入口的 new Vue({
    //      el: '#app',
    //      router,
    //      template: '<App/>',
    //      components: {
    //          App
    //      }
    //  });
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      // 优化内部组件实例化
      // 因为动态合并选项效率太低，没有内部组件选项需要特殊处理
      initInternalComponent(vm, options)
    } else {
        // 单页应用中只有实例化根组件时才会走进这里
        // 选项合并
      vm.$options = mergeOptions(
        // 解析constructor上的options
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
```

