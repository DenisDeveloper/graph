import React from "react";

// var engine = createEngine();
// var model = new DiagramModel();

// var node1 = new DefaultNodeModel("Node 1", "rgb(0,192,255)");
// var port1 = node1.addOutPort("Out");
// node1.setPosition(100, 100);
// var node2 = new DefaultNodeModel("Node 2", "rgb(192,255,0)");
// var port2 = node2.addInPort("In");
// node2.setPosition(400, 100);
// var link1 = port1.link(port2);
// model.addAll(node1, node2, link1);
// engine.setModel(model);

type State = {
  el: HTMLDivElement | null;
  minScale: number;
  maxScale: number;
  scaleSens: number;
  origX: number;
  origY: number;
  translateX: number;
  translateY: number;
  scale: number;
};

type Params = {
  state: State;
  update: (state: State) => void;
  origX: number;
  origY: number;
};

const initialState: State = {
  el: null,
  minScale: 0.1,
  maxScale: 30,
  scaleSens: 50,
  origX: 0,
  origY: 0,
  translateX: 0,
  translateY: 0,
  scale: 1,
};

const getMatrix = (scale: number, transX: number, transY: number) =>
  `matrix(${scale}, 0, 0, ${scale}, ${transX}, ${transY})`;

const pan = ({ state, update, origX, origY }: Params) => {
  if (state.el) {
    const el = state.el;
    const tx = state.translateX + origX;
    const ty = state.translateY + origY;
    el.style.transform = getMatrix(state.scale, tx, ty);
    update({
      ...state,
      translateX: tx,
      translateY: ty,
    });
  }
};

const onDrag = (
  e: React.MouseEvent<HTMLDivElement>,
  state: State,
  update: (state: State) => void
) => {
  if (e.shiftKey) {
    if (!state.el) {
      update({ ...state, el: e.currentTarget });
    } else {
      e.preventDefault();
      pan({ state, update, origX: e.movementX, origY: e.movementY });
    }
  }
};

const Node = () => {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (ref.current) {
    }
  }, []);

  return <div className="node"></div>;
};

const App = () => {
  const ref = React.useRef(null);
  const [state, setState] = React.useState(initialState);

  React.useEffect(() => {
    if (ref.current) {
    }
  }, []);

  return (
    <div
      // onMouseMove={(e) => onDrag(e, state, setState)}
      className="ws"
      ref={ref}
      style={{ width: "100%", height: "100%" }}
    >
      <div className="pane">
        <div
          className="node"
          onMouseMove={(e) => onDrag(e, state, setState)}
          style={{ background: "gray" }}
        ></div>
        <div className="node"></div>
      </div>
    </div>
  );
};

export default App;
