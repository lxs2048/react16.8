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

let nextUnitOfWork = null
// React 并不是用 requestIdleCallback 的。它使用自己编写的 scheduler package。 但两者概念上是相同的
function workLoop(deadline) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )
        shouldYield = deadline.timeRemaining() < 1
    }
    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(nextUnitOfWork) {
    // TODO 我们需要先设置渲染的第一个任务单元，然后开始循环。performUnitOfWork 函数不仅需要执行每一小块的任务单元，还需要返回下一个任务单元。
}
// 把element渲染到页面,暂时只关心如何在 DOM 上添加东西，之后再考虑 更新 和 删除。
function render(element, container) {
    // render 函数中我们把 nextUnitOfWork 置为 fiber 树的根节点。
    nextUnitOfWork = {
        dom: container,
        props: {
            children: [element],
        },
    }
}
// 创建DOM节点抽成一个函数
function createDom(fiber) {
    // 创建dom节点,当 fiber 类型是 TEXT_ELEMENT 的时候我们创建一个 text 节点而不是普通的节点。
    const dom =
        fiber.type === "TEXT_ELEMENT"
            ? document.createTextNode("")
            : document.createElement(fiber.type);
    // 把除了children外的属性赋值给node
    Object.keys(fiber.props)
        .filter(key => key !== "children")
        .forEach(name => {
            dom[name] = fiber.props[name];
        });
    return dom
}
export const Didact = {
    createElement,
    render
};