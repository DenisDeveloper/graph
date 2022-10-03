import React from "react";

type NodeState = {
  name: string;
  x: number;
  y: number;
  isDrag: boolean;
};

type LinkState = {
  x: number;
  y: number;
  isDrag: boolean;
};

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
  nodes: NodeState[];
  links: LinkState[];
};

type Params = {
  state: State;
  update: (state: State) => void;
  origX: number;
  origY: number;
};

const nodes: NodeState[] = [
  { name: "Node 1", x: 100, y: 100, isDrag: false },
  { name: "Node 2", x: 300, y: 250, isDrag: false },
  { name: "Node 3", x: 150, y: 400, isDrag: false },
];

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
  nodes: nodes,
  links: [],
};

// const initialNodeState: NodeProps = {
//   node: NodeState
//   isDrag: false,
// };

const hasPosChanged = (pos: number, prevPos: number) => pos !== prevPos;

const valInRange = (minScale: number, maxScale: number, scale: number) =>
  scale <= maxScale && scale >= minScale;

const getTranslate =
  (minScale: number, maxScale: number, scale: number) =>
  (pos: number, prevPos: number, translate: number) =>
    valInRange(minScale, maxScale, scale) && hasPosChanged(pos, prevPos)
      ? translate + (pos - prevPos * scale) * (1 - 1 / scale)
      : translate;

const getMatrix = (scale: number, transX: number, transY: number) =>
  `matrix(${scale}, 0, 0, ${scale}, ${transX}, ${transY})`;

const getScale = (
  scale: number,
  minScale: number,
  maxScale: number,
  scaleSens: number,
  deltaScale: number
) => {
  let newScale = scale + deltaScale / (scaleSens / scale);
  newScale = Math.max(minScale, Math.min(newScale, maxScale));
  return [scale, newScale];
};

const zoom = (
  state: State,
  update: (s: State) => void,
  x: number,
  y: number,
  deltaScale: number
) => {
  if (state.el) {
    const el = state.el;
    const { left, top } = el.getBoundingClientRect();
    const { minScale, maxScale, scaleSens } = state;
    const [scale, newScale] = getScale(
      state.scale,
      minScale,
      maxScale,
      scaleSens,
      deltaScale
    );
    const origX = x - left;
    const origY = y - top;
    const newOrigX = origX / scale;
    const newOrigY = origY / scale;
    const translate = getTranslate(minScale, maxScale, scale);
    const translateX = translate(origX, state.origX, state.translateX);
    const translateY = translate(origY, state.origY, state.translateY);
    el.style.transformOrigin = `${newOrigX}px ${newOrigY}px`;
    el.style.transform = getMatrix(newScale, translateX, translateY);
    update({
      ...state,
      origX: newOrigX,
      origY: newOrigY,
      translateX,
      translateY,
      scale: newScale,
    });
  }
};

const onZoom = (
  e: React.WheelEvent<HTMLDivElement>,
  state: State,
  update: (state: State) => void
) => {
  // if (e.ctrlKey) {
  if (!state.el) {
    update({ ...state, el: e.currentTarget });
  } else {
    e.preventDefault();
    zoom(state, update, e.pageX, e.pageY, Math.sign(e.deltaY) > 0 ? -1 : 1);
  }
  // }
};

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

const onDragNode = (
  e: React.MouseEvent<HTMLDivElement>,
  state: NodeState,
  update: (state: NodeState) => void
) => {
  if (state.isDrag) {
    e.preventDefault();
    e.stopPropagation();
    update({
      ...state,
      x: state.x + e.movementX,
      y: state.y + e.movementY,
    });
  }
};

const onDragArea = (
  e: React.MouseEvent<HTMLDivElement>,
  state: State,
  update: (state: State) => void
) => {
  if (e.shiftKey) {
    if (!state.el) {
      update({ ...state, el: e.currentTarget });
    } else {
      e.preventDefault();
      e.stopPropagation();
      pan({ state, update, origX: e.movementX, origY: e.movementY });
    }
  }
};

type NodeProps = {
  node: NodeState;
  update: (node: NodeState) => void;
};

const Node = ({ node, update }: NodeProps) => {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (ref.current) {
    }
  }, []);

  return (
    <div
      className="node"
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        cursor: node.isDrag ? "grab" : "default",
      }}
      onMouseLeave={() => update({ ...node, isDrag: false })}
      onMouseDown={(e) => e.button === 0 && update({ ...node, isDrag: true })}
      onMouseUp={() => update({ ...node, isDrag: false })}
      onMouseMove={(e) => onDragNode(e, node, update)}
    ></div>
  );
};

// <path d="M 5,10 L 10 40 L 40 30" fill="none" stroke="grey"></path>

const Link = () => {
  const node1 = { x: 100, y: 100, width: 100, height: 100 };
  const node2 = { x: 300, y: 250, width: 100, height: 100 };
  // prettier-ignore
  const svg = {
    x: node1.x + node1.width,
    y: node1.y + node1.height / 2,
    width: node2.x - (node1.x + node1.width),
    height: (node2.height / 2 + node2.y) - (node1.y + node1.height / 2),
  };
  return (
    <svg
      style={{
        position: "absolute",
        transform: `translate(${svg.x}px, ${svg.y}px)`,
      }}
      width={svg.width}
      height={svg.height}
    >
      <path
        d="M 0,4 L 50 4 L 50 146 L 100 146"
        fill="none"
        strokeWidth="2"
        stroke="blue"
      />
      <path
        // d="M 0,0 Q 50 0, 50 75"
        d={`M 0,0 Q ${svg.width / 2} 0, ${svg.width / 2} ${svg.height / 2}`}
        fill="none"
        strokeWidth="4"
        stroke="black"
      />
      <path
        // d="M 50,75 Q 50 150, 100 150"
        d={`M ${svg.width / 2},${svg.height / 2} Q ${svg.width / 2} ${
          svg.height
        }, ${svg.width} ${svg.height}`}
        fill="none"
        strokeWidth="4"
        stroke="black"
      />
    </svg>
  );
};

const updateNodes = (nodes: NodeState[], node: NodeState, index: number) => {
  let xs = [...nodes];
  xs[index] = node;
  return xs;
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
      onMouseMove={(e) => onDragArea(e, state, setState)}
      onWheel={(e) => onZoom(e, state, setState)}
      className="ws"
      ref={ref}
      style={{ width: "100%", height: "100%" }}
    >
      <div className="pane">
        {state.nodes.map((it, i) => (
          <Node
            key={i}
            node={it}
            update={(node: NodeState) =>
              setState({ ...state, nodes: updateNodes(state.nodes, node, i) })
            }
          />
        ))}
        <Link />
      </div>
    </div>
  );
};

export default App;
