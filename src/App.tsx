import React from "react";
import PolylineIcon from "@mui/icons-material/Polyline";
import LinkIcon from "@mui/icons-material/PolylineOutlined";
import Chip from "@mui/material/Chip";
import ProcessIcon from "@mui/icons-material/DeveloperBoard";
import { isTemplateExpression } from "typescript";

type NodeState = {
  uuid: number;
  name: string;
  x: number;
  y: number;
  isDrag: boolean;
};

type LinkState = {
  in: number;
  out: number;
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
  { uuid: 1, name: "Node 1", x: 100, y: 100, isDrag: false },
  { uuid: 2, name: "Node 2", x: 300, y: 250, isDrag: false },
];

const links: LinkState[] = [{ out: 0, in: 1, isDrag: false }];

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
  links: links,
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
  const width = 100;
  const height = 100;

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
    >
      <div
        className="socket"
        style={{ left: `${width - 5}px`, top: `${height / 2 - 5}px` }}
      ></div>
      <div
        className="socket"
        style={{ left: `${-5}px`, top: `${height / 2 - 5}px` }}
      ></div>
    </div>
  );
};

type DraftNodeState = {
  x: number;
  y: number;
};

type DraftNodeProps = {
  node: DraftNodeState;
};

const onDragDraftNode = (
  e: React.MouseEvent<HTMLDivElement>,
  state: DraftNodeState,
  update: (state: DraftNodeState) => void
) => {
  e.preventDefault();
  e.stopPropagation();
  update({
    ...state,
    x: Math.abs(e.clientX - 50),
    y: Math.abs(e.clientY - 50),
  });
};

const DraftNode = ({ node }: DraftNodeProps) => {
  const ref = React.useRef(null);
  const width = 100;
  const height = 100;

  React.useEffect(() => {
    if (ref.current) {
    }
  }, []);

  return (
    <div
      className="draft-node"
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        cursor: "none",
      }}
    ></div>
  );
};

// <path d="M 5,10 L 10 40 L 40 30" fill="none" stroke="grey"></path>

type LinkProps = {
  nodeIn: NodeState;
  nodeOut: NodeState;
};

const Link = ({ nodeIn, nodeOut }: LinkProps) => {
  const nodeOutWidth = 100;
  const nodeOutHeight = 100;
  const nodeInWidth = 100;
  const nodeInHeight = 100;
  // prettier-ignore
  const svg = {
    x: nodeOut.x + nodeOutWidth,
    y: nodeOut.y + nodeOutHeight / 2,
    width: nodeIn.x - (nodeOut.x + nodeOutWidth),
    height: (nodeInHeight / 2 + nodeIn.y) - (nodeOut.y + nodeOutHeight / 2),
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
      {/* <path
        // d="M 0,4 L 50 4 L 50 146 L 100 146"
        d={`M 0,4 L ${svg.width * 0.2} 4 L ${svg.width * 0.8} ${svg.height} L ${
          svg.width
        } ${svg.height} `}
        fill="none"
        strokeWidth="2"
        stroke="blue"
      /> */}
      <path
        // d="M 0,0 Q 50 0, 50 75"
        d={`M 0,0 Q ${svg.width / 2} 0, ${svg.width / 2} ${svg.height / 2}`}
        // d={`M 0,0 Q ${svg.width * 0.2} 0, ${svg.width * 0.8} ${svg.height / 2}`}
        fill="none"
        strokeWidth="2"
        stroke="blue"
      />
      <path
        // d="M 50,75 Q 50 150, 100 150"
        d={`M ${svg.width / 2},${svg.height / 2} Q ${svg.width / 2} ${
          svg.height
        }, ${svg.width} ${svg.height}`}
        fill="none"
        strokeWidth="2"
        stroke="blue"
      />
    </svg>
  );
};

const updateNodes = (nodes: NodeState[], node: NodeState, index: number) => {
  let xs = [...nodes];
  xs[index] = node;
  return xs;
};

type ToolbarItem = {
  title: string;
  selected: boolean;
  icon: JSX.Element;
};

const toolbarItems: ToolbarItem[] = [
  { title: "link", selected: false, icon: <LinkIcon fontSize="small" /> },
  { title: "process", selected: false, icon: <ProcessIcon fontSize="small" /> },
];

type ToolbarProps = {
  items: ToolbarItem[];
  onSelect: (item: ToolbarItem) => void;
};

type ToolbarState = {
  items: ToolbarItem[];
  selected: string;
};

const Toolbar = ({ onSelect, items }: ToolbarProps) => {
  return (
    <div className="toolbar">
      {items.map((it) => (
        <Chip
          key={it.title}
          label={it.title}
          onClick={() => onSelect(it)}
          sx={{ marginRight: "10px" }}
          variant={it.selected ? "filled" : "outlined"}
          icon={it.icon}
        />
      ))}
    </div>
  );
};

const App = () => {
  const ref = React.useRef(null);
  const [state, setState] = React.useState(initialState);
  const [draftNode, setDraftNode] = React.useState<DraftNodeState>({
    x: -400,
    y: -400,
  });

  const [toolbarState, setToolbarState] = React.useState<ToolbarState>({
    items: toolbarItems,
    selected: "",
  });

  // React.useEffect(() => {
  //   if (ref.current) {
  //   }
  // }, []);

  return (
    <>
      <Toolbar
        items={toolbarState.items}
        onSelect={(tool) =>
          setToolbarState({
            ...toolbarState,
            selected: !tool.selected ? tool.title : "",
            items: toolbarState.items.map((item) => ({
              ...item,
              selected: item.title === tool.title && !item.selected,
            })),
          })
        }
      />
      <div
        onMouseMove={(e) => {
          switch (toolbarState.selected) {
            case "process":
              onDragDraftNode(e, draftNode, (node) => setDraftNode(node));
              break;
            case "link":
              console.log("link");
              break;
            default:
              onDragArea(e, state, setState);
          }
        }}
        onMouseDown={() => {
          switch (toolbarState.selected) {
            case "process":
              setState({
                ...state,
                nodes: [
                  ...state.nodes,
                  {
                    uuid: 1,
                    name: "Node 1",
                    x: draftNode.x,
                    y: draftNode.y,
                    isDrag: false,
                  },
                ],
              });
              break;
            case "link":
              console.log("link");
              break;
            default:
              console.log("default");
          }
        }}
        onWheel={(e) => onZoom(e, state, setState)}
        className="ws"
        ref={ref}
        style={{ width: "100%", height: "100%" }}
      >
        <div className="pane">
          {toolbarState.selected === "process" && (
            <DraftNode node={draftNode} />
          )}
          {state.nodes.map((it, i) => (
            <Node
              key={i}
              node={it}
              update={(node: NodeState) =>
                setState({ ...state, nodes: updateNodes(state.nodes, node, i) })
              }
            />
          ))}
          {state.links.map((link, i) => (
            <Link
              key={i}
              nodeIn={state.nodes[link.in]}
              nodeOut={state.nodes[link.out]}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default App;
