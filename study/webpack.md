# webpack

## 插件

html-webpack-plugin - 创建新的index.html文件，并自动插入bundle
clean-webpack-plugin - 清理dist文件夹
UglifyJSPlugin - 压缩打包后的文件，并删除被标记的无效代码
DefinePlugin - webpack 内置插件可以为所有依赖定义变量，最常见的process.env.NODE_ENV环境变量
CommonsChunkPlugin - 代码分离 webpack v4之前版本使用
SplitChunksPlugin - 代码分离 webpack v4之后版本使用

## source-map

在开发中使用，可以快速定位错误位置并进行调试。

## 工具

webpack-dev-server - 提供了一个简单的 web 服务器，并且能够实时重新加载

## 模块热替换 - HMR

它允许在运行时更新各种模块，而无需进行完全刷新

HotModuleReplacementPlugin
devServer配置项设置hot: true

当使用 webpack dev server 和 Node.js API 时，不要将 dev server 选项放在 webpack 配置对象(webpack config object)中。而是，在创建选项时，将其作为第二个参数传递。例如：

new WebpackDevServer(compiler, options)

## tree shaking

ree shaking 是一个术语，通常用于描述移除 JavaScript 上下文中的未引用代码。
这种方式是通过 package.json 的 "sideEffects" 属性来实现的。
```
{
  "name": "your-project",
  "sideEffects": false
}
```
如同上面提到的，如果所有代码都不包含副作用，我们就可以简单地将该属性标记为 false，来告知 webpack，它可以安全地删除未用到的 export 导出。

上边只是标记了哪些无副作用的代码可以删除，我还还要真正的在打包出来的bundle中将它删除。
使用UglifyJSPlugin插件，但是webpack 4.0中更简单了，只需要将mode： 'production'即可。

## code split 代码分离

有三种常用的代码分离方法：

- 入口起点：使用 entry 配置手动地分离代码。
- 防止重复：使用 SplitChunks 去重和分离 chunk。
- 动态导入：通过模块的内联函数调用来分离代码。

### 入口起点
这种方式手动配置较多，并有一些陷阱。

- 如果入口 chunks 之间包含重复的模块，那些重复模块都会被引入到各个 bundle 中。
- 这种方法不够灵活，并且不能将核心应用程序逻辑进行动态拆分代码。

### 防止重复
使用插件，在webpack v4之前，使用CommonsChunkPlugin，在这之后，使用SplitChunksPlugin

splitChunks
```
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
```

CommonsChunkPlugin会将重复的部分单独分离到一个文件

webpack 提供了一个优化功能，可以根据提供的选项将运行时代码拆分成单独的块，直接将 optimization.runtimeChunk 设置为 single，就能创建单个运行时 bundle.

### 动态导入

- 使用符合 ECMAScript 提案 的 import() 语法（推荐）
- 使用 webpack 特定的 require.ensure

并在output配置项中使用chunkFilename

## 缓存

通过使用 output.filename 进行文件名替换，可以确保浏览器获取到修改后的文件。[hash] 替换可以用于在文件名中包含一个构建相关(build-specific)的 hash，但是更好的方式是使用 [chunkhash] 替换，在文件名中包含一个 chunk 相关(chunk-specific)的哈希。

```
output: {
    filename: '[name].[chunkhash].js'
}
```
