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
let wipRoot = null//把修改 DOM 这部分内容记录在 fiber tree 上，通过追踪这颗树来收集所有 DOM 节点的修改，这棵树叫做 wipRoot（work in progress root）。
// React 并不是用 requestIdleCallback 的。它使用自己编写的 scheduler package。 但两者概念上是相同的
function workLoop(deadline) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )
        shouldYield = deadline.timeRemaining() < 1
    }
    // 一旦完成了 wipRoot 这颗树上的所有任务（next unit of work 为 undefined），我们把整颗树的变更提交（commit）到实际的 DOM 上。
    if (!nextUnitOfWork && wipRoot) {
        commitRoot()
    }
    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

//todo 至今我们只完成了 添加 东西到 DOM 上这个操作，更新和删除 node 节点呢
function commitRoot() {
    commitWork(wipRoot.child)
    wipRoot = null
}

function commitWork(fiber) {
    if (!fiber) {
        return
    }
    const domParent = fiber.parent.dom
    domParent.appendChild(fiber.dom)
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

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
    /* 一边遍历 element，一边生成新的 DOM 节点并且添加到其父节点上。在完成整棵树的渲染前，浏览器还要中途阻断这个过程。 那么用户就有可能看到渲染未完全的 UI
    把修改 DOM 节点的这部分给单独移出 */
    // if (fiber.parent) {
    //     fiber.parent.dom.appendChild(fiber.dom)
    // }
    // 为每个子节点创建对应的新的 fiber 节点。
    const elements = fiber.props.children
    reconcileChildren(fiber,elements)
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
function reconcileChildren(wipFiber, elements){
    // todo 调和（reconcile）旧的 fiber 节点 和新的 react elements。
    let index = 0
    let prevSibling = null
    while (index < elements.length) {
        // 每个 fiber 都会指向它的第一个子节点、它的下一个兄弟节点 和 父节点
        const element = elements[index]
        const newFiber = {
            type: element.type,
            props: element.props,
            parent: wipFiber,
            dom: null,
        }
        // 根据是否是第一个子节点，来设置父节点的 child 属性的指向，或者上一个节点的 sibling 属性的指向。
        if (index === 0) {
            wipFiber.child = newFiber
        } else {
            prevSibling.sibling = newFiber
        }

        prevSibling = newFiber
        index++
    }
}
// 把element渲染到页面,暂时只关心如何在 DOM 上添加东西，之后再考虑 更新 和 删除。
function render(element, container) {
    // 创建了 根fiber，并且将其设为 nextUnitOfWork 作为第一个任务单元，剩下的任务单元会通过 performUnitOfWork 函数完成并返回
    wipRoot = {
        dom: container,
        props: {
            children: [element],
        },
    }
    nextUnitOfWork = wipRoot
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