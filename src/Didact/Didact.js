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
let currentRoot = null//这里需要保存”上次提交到 DOM 节点的 fiber 树” 的”引用”（reference）。我们称之为 currentRoot。
let deletions = null//保存要移除的 dom 节点。
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
    deletions.forEach(commitWork)
    commitWork(wipRoot.child)
    currentRoot = wipRoot
    wipRoot = null
}

function commitWork(fiber) {
    if (!fiber) {
        return
    }
    // const domParent = fiber.parent.dom
    let domParentFiber = fiber.parent
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom
    if (
        fiber.effectTag === "PLACEMENT" &&
        fiber.dom != null
    ) {
        // 如果 fiber 节点有我们之前打上的 PLACEMENT 标，那么在其父 fiber 节点的 DOM 节点上添加该 fiber 的 DOM。
        domParent.appendChild(fiber.dom)
    } else if (
        fiber.effectTag === "UPDATE" &&
        fiber.dom != null
    ) {
        // 如果是 UPDATE 标记，我们需要更新已经存在的旧 DOM 节点的属性值。
        updateDom(
          fiber.dom,
          fiber.alternate.props,
          fiber.props
        )
    } else if (fiber.effectTag === "DELETION") {
        // 如果是 DELETION 标记，我们移除该子节点。
        commitDeletion(fiber, domParent)
    }
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
      domParent.removeChild(fiber.dom)
    } else {
      commitDeletion(fiber.child, domParent)
    }
}

// 设置渲染的第一个任务单元，然后开始循环。performUnitOfWork 函数不仅需要执行每一小块的任务单元，还需要返回下一个任务单元。
function performUnitOfWork(fiber) {
    /* 函数组件的不同点在于：
        函数组件的 fiber 没有 DOM 节点
        并且子节点由函数运行得来而不是直接从 props 属性中获取
    */
    const isFunctionComponent = fiber.type instanceof Function
    if (isFunctionComponent) {
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
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
let wipFiber = null
let hookIndex = null
function updateFunctionComponent(fiber) {
    wipFiber = fiber
    hookIndex = 0
    wipFiber.hooks = []
    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
}
function updateHostComponent(fiber){
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

}
function reconcileChildren(wipFiber, elements){
    // todo 调和（reconcile）旧的 fiber 节点 和新的 react elements。
    // 在迭代整个 react elements 数组的同时我们也会迭代旧的 fiber 节点（wipFiber.alternate）。
    let index = 0
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child
    let prevSibling = null
    while (index < elements.length || oldFiber != null) {
        // 每个 fiber 都会指向它的第一个子节点、它的下一个兄弟节点 和 父节点
        const element = elements[index]
        let newFiber = null
        const sameType = oldFiber && element && element.type == oldFiber.type
        if (sameType) {
            // 对于新旧节点类型是相同的情况，我们可以复用旧的 DOM，仅修改上面的属性
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: "UPDATE",
            }
        }
        if (element && !sameType) {
            // 如果类型不同，意味着我们需要创建一个新的 DOM 节点
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: "PLACEMENT",
            }
        }
        if (oldFiber && !sameType) {
            // 如果类型不同，并且旧节点存在的话，需要把旧节点的 DOM 给移除
            oldFiber.effectTag = "DELETION"
            deletions.push(oldFiber)
        }
        // React使用 key 这个属性来优化 reconciliation 过程。比如, key 属性可以用来检测 elements 数组中的子组件是否仅仅是更换了位置。
        if (oldFiber) {
            oldFiber = oldFiber.sibling
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
const isEvent = key => key.startsWith("on")
const isProperty = key =>
  key !== "children" && !isEvent(key)
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)
function updateDom(dom, prevProps, nextProps) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
  .filter(isEvent)
  .filter(
    key =>
      !(key in nextProps) ||
      isNew(prevProps, nextProps)(key)
  )
  .forEach(name => {
    const eventType = name
      .toLowerCase()
      .substring(2)
    dom.removeEventListener(
      eventType,
      prevProps[name]
    )
  })
  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })
  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })
    // Add event listeners
  Object.keys(nextProps)
  .filter(isEvent)
  .filter(isNew(prevProps, nextProps))
  .forEach(name => {
    const eventType = name
      .toLowerCase()
      .substring(2)
    dom.addEventListener(
      eventType,
      nextProps[name]
    )
  })
}
// 把element渲染到页面,暂时只关心如何在 DOM 上添加东西，之后再考虑 更新 和 删除。
function render(element, container) {
    // 创建了 根fiber，并且将其设为 nextUnitOfWork 作为第一个任务单元，剩下的任务单元会通过 performUnitOfWork 函数完成并返回
    wipRoot = {
        dom: container,
        props: {
            children: [element],
        },
        alternate: currentRoot,
    }
    deletions = []
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
    updateDom(dom, {}, fiber.props)
    return dom
}
function useState(initial){
    const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]
    const hook = {
        state: oldHook ? oldHook.state : initial,
        queue: [],
    }
    const actions = oldHook ? oldHook.queue : []
    actions.forEach(action => {
        hook.state = action(hook.state)
    })
    const setState = action => {
        hook.queue.push(action)
        wipRoot = {
          dom: currentRoot.dom,
          props: currentRoot.props,
          alternate: currentRoot,
        }
        nextUnitOfWork = wipRoot
        deletions = []
    }

    wipFiber.hooks.push(hook)
    hookIndex++
    return [hook.state,setState]
}
export const Didact = {
    createElement,
    render,
    useState
};