/** @jsx Didact.createElement */
// 这样注释一下，babel 会将 JSX 编译成我们需要的函数。
import { Didact } from './Didact/Didact'
const updateValue = e => {
    renderByMyReact(e.target.value)
}
const App = (props)=>{
    return (
        <div style="background: salmon">
            <h2 style="text-align:center">from Didact</h2>
            <input onInput={updateValue} value={props.value} />
            <h1>
                <span>{props.value}</span>
                {props.value === 'hello' ? <p>World</p> : null}
            </h1>
            <h3>ohhh</h3>
        </div>
    )
}
const renderByMyReact = (value) => {
  const element = <App value={value} />;

  const container = document.getElementById("didact-root");
  Didact.render(element, container);
}
renderByMyReact('hello')