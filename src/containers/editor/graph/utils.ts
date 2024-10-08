import { edgeHighlightStyle, type EdgeWithData, nodeHighlightStyle, type NodeWithData } from "@/lib/graph/layout";
import { isParent } from "@/lib/idgen";
import { clone } from "@/lib/utils";
import { type Node as FlowNode, type Edge } from "@xyflow/react";
import { filter } from "lodash-es";

type GetNodeFn = (id: string) => FlowNode | undefined;
type GetEdgeFn = (id: string) => Edge | undefined;

export function getVisibleDescendant(node: NodeWithData, getNode: GetNodeFn, getEdge: GetEdgeFn, prefixId?: string) {
  const nodes: NodeWithData[] = [];
  const edges: EdgeWithData[] = [];

  const addChildren = (children: NodeWithData[]) => {
    nodes.push(...filter(children));
    edges.push(...(filter(children.map((child) => child && getEdge(child.id))) as EdgeWithData[]));
  };

  let childrenIds = node.data.childrenIds;

  if (prefixId) {
    childrenIds = childrenIds.filter((id) => id === prefixId || isParent(prefixId, id));
  }

  const children = childrenIds.map(getNode) as NodeWithData[];
  addChildren(children);

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const children = node.data.childrenIds.map(getNode) as NodeWithData[];
    addChildren(children);
  }

  return { nodes, edges };
}

export function getVisibleAncestor(node: NodeWithData, getNode: GetNodeFn, getEdge: GetEdgeFn) {
  const nodes: NodeWithData[] = [];
  const edges: EdgeWithData[] = [];

  while (node.data.parentId) {
    const edge = getEdge(node.id) as EdgeWithData;
    edge && edges.push(edge);

    const parent = getNode(node.data.parentId) as NodeWithData;
    if (!parent) {
      break;
    }

    nodes.push(parent);
    node = parent;
  }

  return { nodes, edges };
}

export function separateMap<T extends FlowNode | Edge>(all: T[], sub: T[], subMap?: (v: T) => T, outMap?: (v: T) => T) {
  const whiteMap = new Map();
  sub.forEach((v) => whiteMap.set(v.id, true));

  return all.map((v) => {
    const fn = whiteMap.get(v.id) ? subMap : outMap;
    return fn ? clone(fn(v)) : v;
  });
}

// NOTICE: must be used with clone(...), otherwise the graph will not re-render
export function highlightNode(node: NodeWithData, enable: boolean): NodeWithData {
  const style = enable ? nodeHighlightStyle : undefined;
  node.style = style;
  node.data.style = style;
  return node;
}

// NOTICE: must be used with clone(...), otherwise the graph will not re-render
export function highlightEdge(edge: EdgeWithData, enable: boolean): EdgeWithData {
  const style = enable ? edgeHighlightStyle : undefined;

  if (!edge.data) {
    (edge.data as any) = {};
  }

  edge.style = style;
  edge.data!.style = style;
  return edge;
}

// NOTICE: must be used with clone(...), otherwise the graph will not re-render
export function toggleToolbar(node: NodeWithData, clicked: NodeWithData | undefined) {
  node.data.toolbarVisible = node.id === clicked?.id || undefined;
  return node;
}

// NOTICE: must be used with clone(...), otherwise the graph will not re-render
export function toggleHidden<T extends FlowNode | Edge>(v: T, hide?: boolean) {
  v.hidden = hide;
  return v;
}
