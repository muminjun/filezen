// src/lib/collageTree.ts

export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | 'free';

export interface CellImage {
  src: string;    // Object URL
  x: number;     // 셀 내 오프셋 (px)
  y: number;
  scale: number;  // 기본값 1
}

export interface SplitNode {
  type: 'split';
  direction: 'h' | 'v'; // h: 위아래, v: 좌우
  ratio: number;         // 0~1, 첫 번째 자식의 비율
  children: [CollageNode, CollageNode];
}

export interface LeafNode {
  type: 'leaf';
  id: string;
  image?: CellImage;
}

export type CollageNode = SplitNode | LeafNode;

export interface CollageStyle {
  aspectRatio: AspectRatio;
  gap: number;          // 0~20
  padding: number;      // 0~40
  borderRadius: number; // 0~24
  background: string;   // CSS color
}

export interface CollageState {
  tree: CollageNode;
  style: CollageStyle;
  selectedId: string | null;
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function generateId(): string {
  return `cell-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function makeLeaf(image?: CellImage): LeafNode {
  return { type: 'leaf', id: generateId(), image };
}

export function defaultState(): CollageState {
  return {
    tree: makeLeaf(),
    style: {
      aspectRatio: '1:1',
      gap: 4,
      padding: 0,
      borderRadius: 8,
      background: '#ffffff',
    },
    selectedId: null,
  };
}

/** 지정 id의 리프를 SplitNode로 교체 */
export function splitNode(
  node: CollageNode,
  id: string,
  direction: 'h' | 'v',
): CollageNode {
  if (node.type === 'leaf') {
    if (node.id !== id) return node;
    return {
      type: 'split',
      direction,
      ratio: 0.5,
      children: [{ ...node }, makeLeaf()],
    };
  }
  return {
    ...node,
    children: [
      splitNode(node.children[0], id, direction),
      splitNode(node.children[1], id, direction),
    ],
  };
}

/**
 * 지정 id(리프)의 부모 SplitNode를 형제 노드로 교체.
 * 형제가 LeafNode일 때만 동작 (병합 가능 여부 확인은 canMerge 사용).
 */
export function mergeNode(node: CollageNode, id: string): CollageNode {
  if (node.type === 'leaf') return node;
  const [a, b] = node.children;
  if (a.type === 'leaf' && a.id === id && b.type === 'leaf') return b;
  if (b.type === 'leaf' && b.id === id && a.type === 'leaf') return a;
  return {
    ...node,
    children: [mergeNode(a, id), mergeNode(b, id)],
  };
}

/** 병합 가능 여부: id 리프의 형제도 리프여야 함 */
export function canMerge(node: CollageNode, id: string): boolean {
  if (node.type === 'leaf') return false;
  const [a, b] = node.children;
  if (a.type === 'leaf' && a.id === id) return b.type === 'leaf';
  if (b.type === 'leaf' && b.id === id) return a.type === 'leaf';
  return canMerge(a, id) || canMerge(b, id);
}

/** SplitNode의 ratio 업데이트 (CollageDivider 드래그용) */
export function updateRatio(
  node: CollageNode,
  splitId: string, // SplitNode를 식별하기 위해 첫 번째 자식 리프 id 사용
  ratio: number,
): CollageNode {
  if (node.type === 'leaf') return node;
  const [a, b] = node.children;
  if (a.type === 'leaf' && a.id === splitId) {
    return { ...node, ratio: Math.max(0.1, Math.min(0.9, ratio)) };
  }
  return {
    ...node,
    children: [updateRatio(a, splitId, ratio), updateRatio(b, splitId, ratio)],
  };
}

/** 셀에 이미지 설정 */
export function setImage(
  node: CollageNode,
  id: string,
  image: CellImage | undefined,
): CollageNode {
  if (node.type === 'leaf') {
    return node.id === id ? { ...node, image } : node;
  }
  return {
    ...node,
    children: [setImage(node.children[0], id, image), setImage(node.children[1], id, image)],
  };
}

/** 셀 내 이미지 오프셋·스케일 업데이트 */
export function updateImageTransform(
  node: CollageNode,
  id: string,
  patch: Partial<CellImage>,
): CollageNode {
  if (node.type === 'leaf') {
    if (node.id !== id || !node.image) return node;
    return { ...node, image: { ...node.image, ...patch } };
  }
  return {
    ...node,
    children: [
      updateImageTransform(node.children[0], id, patch),
      updateImageTransform(node.children[1], id, patch),
    ],
  };
}

/** 두 셀의 이미지 교체 */
export function swapImages(
  node: CollageNode,
  idA: string,
  idB: string,
): CollageNode {
  const imgA = findImage(node, idA);
  const imgB = findImage(node, idB);
  let result = setImage(node, idA, imgB);
  result = setImage(result, idB, imgA);
  return result;
}

function findImage(node: CollageNode, id: string): CellImage | undefined {
  if (node.type === 'leaf') return node.id === id ? node.image : undefined;
  return findImage(node.children[0], id) ?? findImage(node.children[1], id);
}

/** 모든 리프 id 목록 (순서 보장: 좌→우, 위→아래) */
export function collectLeafIds(node: CollageNode): string[] {
  if (node.type === 'leaf') return [node.id];
  return [...collectLeafIds(node.children[0]), ...collectLeafIds(node.children[1])];
}
