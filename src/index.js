/** @jsx Didact.createElement */
// 这样注释一下，babel 会将 JSX 编译成我们需要的函数。
import { Didact } from './Didact/Didact'
const renderByMyReact = () => {
  const element = (
      <div style="background: salmon">
          <h2 style="text-align:center">from Didact</h2>
          <h1>
              <span>Hello</span>
              <p>World</p>
          </h1>
          <h3>ohhh</h3>
      </div>
  );
  console.log(element,'数据😎😎😎element');

  const container = document.getElementById("didact-root");
  Didact.render(element, container);
}
renderByMyReact()