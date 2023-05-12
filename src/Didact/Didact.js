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

// 设置渲染的第一个任务单元，然后开始循环。performUnitOfWork 函数不仅需要执行每一小块的任务单元，还需要返回下一个任务单元。
function performUnitOfWork(fiber) {
    // 每一个 element 都是一个 fiber，每一个 fiber 都是一个任务单元。
    /*
        每个 fiber 节点完成下述三件事：
        把 element 添加到 DOM 上
        为该 fiber 节点的子节点新建 fiber
        挑出下一个任务单元
    */
    // 首先创建 fiber 对应的 DOM 节点，并将它添加（append）到父节点的 DOM 上。
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    if (fiber.parent) {
        fiber.parent.dom.appendChild(fiber.dom)
    }
    // 为每个子节点创建对应的新的 fiber 节点。
    const elements = fiber.props.children
    let index = 0
    let prevSibling = null
    while (index < elements.length) {
        // 每个 fiber 都会指向它的第一个子节点、它的下一个兄弟节点 和 父节点
        const element = elements[index]
        const newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null,
        }
        // 根据是否是第一个子节点，来设置父节点的 child 属性的指向，或者上一个节点的 sibling 属性的指向。
        if (index === 0) {
            fiber.child = newFiber
        } else {
            prevSibling.sibling = newFiber
        }

        prevSibling = newFiber
        index++
    }
    // 最后找到下一个工作单元。 先试试 child 节点，再试试 sibling 节点，再试试 “uncle” 节点。
    if (fiber.child) {
        return fiber.child
    }
    let nextFiber = fiber
    while (nextFiber) {
        // 先试试 child 节点，再试试 sibling 节点，再试试 “uncle” 节点，或者直到达到根节点
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}
// 把element渲染到页面,暂时只关心如何在 DOM 上添加东西，之后再考虑 更新 和 删除。
function render(element, container) {
    // 创建了 根fiber，并且将其设为 nextUnitOfWork 作为第一个任务单元，剩下的任务单元会通过 performUnitOfWork 函数完成并返回
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