// 创建element
function createElement(type, props, ...children) {
    // 从最左侧的叶子节点开始，向右，右边有孩子，从孩子的最左侧叶子节点开始，向右，本层完成后向上
    // console.log(type, props, children, '数据😎😎😎type,props,children');
    // return 出去的结果会在父级的children里面
    return {
        type,
        props: {
            ...props,
            children: children.map(child =>
                typeof child === "object" ? child : createTextElement(child) // 孩子不是对象就是纯字符串，给个相应的类型
            )
        }
    };
}
// 创建文本类型的element
function createTextElement(text) {
    // React 对于一个基本值的子元素，不会创建空数组也不会包一层 TEXT_ELEMENT，但是为了简化代码，我们的实现和 React 有差异
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: []
        }
    };
}
// 把element渲染到页面,暂时只关心如何在 DOM 上添加东西，之后再考虑 更新 和 删除。
function render(element, container) {
    // 创建dom节点,当 element 类型是 TEXT_ELEMENT 的时候我们创建一个 text 节点而不是普通的节点。
    const dom =
        element.type === "TEXT_ELEMENT"
            ? document.createTextNode("")
            : document.createElement(element.type);
    // 把除了children外的属性赋值给dom
    Object.keys(element.props)
      .filter(key => key !== "children")
      .forEach(name => {
        dom[name] = element.props[name];
      });
    // 我们对每一个子节点递归地做相同的处理，这里的递归调用会导致一些问题。一旦开始渲染，在我们将 react element 数渲染出来之前没法暂停。
    //todo 接下来将整个任务分成一些小块，每当我们完成其中一块之后需要把控制权交给浏览器，让浏览器判断是否有更高优先级的任务需要完成。
    element.props.children.forEach(child => render(child, dom));
    // 最最后把根节点挂载
    container.appendChild(dom);
}
export const Didact = {
    createElement,
    render
};