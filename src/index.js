import React from "react";
import ReactDOM from "react-dom";
const rootEle = document.getElementById('didact-root'); // 根据产品名称进行修改 xxx-root
// 以下3个中任意一个element被render都可以在页面正常显示

/* JSX 元素。这不是合法的 JavaScript 代码，因此我们需要将其替换成合法的 JavaScript 代码。 */
// const element = <h1 title="foo">Hello</h1>
/* JSX 通过构建工具 Babel 转换成 JS。这个转换过程很简单：将标签中的代码替换成 createElement，并把标签名、参数和子节点作为参数传入。 */
// const element = React.createElement(
//   "h1",
//   { title: "foo" },
//   "Hello"
// )
/* React.createElement 验证入参并生成了一个对象。因此我们将其替换成如下代码。 */
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
}
// ReactDOM.render(element, rootEle);

// React 在 render 函数里改变 DOM，我们先手动更新下DOM。

const container = document.getElementById("didact-root")

const node = document.createElement(element.type)
node["title"] = element.props.title

const text = document.createTextNode("")
text["nodeValue"] = element.props.children

node.appendChild(text)
container.appendChild(node)
// 在不使用 React 的情况下，我们成功渲染了和 React 相同的内容。
