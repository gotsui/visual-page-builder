import { BuilderNode, LayoutConfig, ResponsiveStyle } from "./schema";

type NodeUpdater = (node: BuilderNode) => BuilderNode;

const mapTree = (
    root: BuilderNode,
    id: string,
    updater: NodeUpdater,
): BuilderNode => {
    if (root.id === id) {
        return updater(root);
    }

    const [nextChildren, hasChanged] = root.children.reduce<[BuilderNode[], boolean]>(
        ([accChildren, accChanged], child) => {
            const next = mapTree(child, id, updater);
            return [[...accChildren, next], accChanged || next !== child];
        },
        [[], false]
    );

    return hasChanged ? { ...root, children: nextChildren } : root;
};

const removeFromTree = (
    root: BuilderNode,
    id: string,
): BuilderNode | null => {
    if (root.id === id) {
        return null;
    }

    const nextChildren = root.children.map((child) => removeFromTree(child, id)).filter((child) => child !== null);

    const hasChanged = nextChildren.length !== root.children.length || nextChildren.some((child, index) => child !== root.children[index]);

    return hasChanged ? { ...root, children: nextChildren } : root;
};

const insertIntoTree = (
    root: BuilderNode,
    parentId: string,
    index: number,
    node: BuilderNode,
): BuilderNode => {
    return mapTree(root, parentId, (parent) => {
        const clamped = Math.max(0, Math.min(index, parent.children.length));
        const children = [
            ...parent.children.slice(0, clamped),
            node,
            ...parent.children.slice(clamped),
        ];
        return { ...parent, children };
    });
};

const isDescendantOrSelf = (
    root: BuilderNode,
    ancestorId: string,
    targetId: string,
): boolean => {
    if (ancestorId === targetId) {
        return false;
    }

    const ancestor = findNode(root, ancestorId);

    if (!ancestor) {
        return false;
    }

    const stack: BuilderNode[] = [...ancestor.children];

    while (stack.length > 0) {
        const current = stack.pop();

        if (current && current.id === targetId) {
            return true;
        }

        if (current?.children) {
            stack.push(...current.children);
        }
    }

    return false;
};

export const findNode = (
    root: BuilderNode,
    id: string,
): BuilderNode | null => {
    if (root.id === id) {
        return root;
    }

    for (const child of root.children) {
        const found = findNode(child, id);

        if (found) {
            return found;
        }
    }

    return null;
};

export const findParent = (
    root: BuilderNode,
    id: string,
): BuilderNode | null => {
    for (const child of root.children) {
        if (child.id == id) {
            return root;
        }

        const found = findParent(child, id);

        if (found) {
            return found;
        }
    }

    return null;
};

export const findIndexInParent = (
    root: BuilderNode,
    id: string,
): number => {
    const parent = findParent(root, id);

    if (!parent) {
        return -1;
    }

    return parent.children.findIndex((c) => c.id === id);
};

export const addNode = (
    root: BuilderNode,
    parentId: string,
    node: BuilderNode,
    index?: number,
): BuilderNode => {
    const parent = findNode(root, parentId);

    if (!parent) {
        return root;
    }

    if (parent.type !== "container") {
        return root;
    }

    const at = index ?? parent.children.length;

    return insertIntoTree(root, parentId, at, node);
};

export const removeNode = (
    root: BuilderNode,
    id: string,
): BuilderNode => {
    if (root.id === id) {
        return root;
    }

    const next = removeFromTree(root, id);

    return next ?? root;
};

export const moveNode = (
    root: BuilderNode,
    nodeId: string,
    toParentId: string,
    toIndex: number,
): BuilderNode => {
    if (root.id === nodeId) {
        return root;
    }

    if (nodeId === toParentId) {
        return root;
    }

    if (isDescendantOrSelf(root, nodeId, toParentId)) {
        return root;
    }

    const node = findNode(root, nodeId);
    const toParent = findNode(root, toParentId);

    if (!node || !toParent) {
        return root;
    }

    if (toParent.type !== "container") {
        return root;
    }

    const fromParent = findParent(root, nodeId);
    const fromIndex = fromParent
        ? fromParent.children.findIndex((c) => c.id === nodeId)
        : -1;

    const adjustedIndex = fromParent && fromParent.id === toParentId && fromIndex >= 0 && fromIndex < toIndex
        ? toIndex - 1
        : toIndex;

    const without = removeFromTree(root, nodeId);

    if (!without) {
        return root;
    }

    return insertIntoTree(without, toParentId, adjustedIndex, node);
};

export type NodePatch = {
    props?: Record<string, unknown>;
    style?: ResponsiveStyle;
    layout?: LayoutConfig;
};

export const updateNode = (
    root: BuilderNode,
    id: string,
    patch: NodePatch,
): BuilderNode => {
    return mapTree(root, id , (node) => {
        const next: BuilderNode = { ...node };

        if (patch.props) {
            next.props = { ...node.props, ...patch.props };
        }

        if (patch.style) {
            next.style = {
                ...node.style,
                ...patch.style,
                base: {
                    ...node.style.base,
                    ...patch.style.base,
                },
            };
        }

        if (patch.layout) {
            next.layout = {
                ...(node.layout ?? {
                    direction: "column",
                    justify: "start",
                    align: "start",
                    gap: 4,
                    wrap: false,
                }),
                ...patch.layout,
            };
        }

        return next;
    });
};

export const replaceNodeProps = (
    root: BuilderNode,
    id: string,
    props: Record<string, unknown>,
): BuilderNode => {
    return mapTree(root, id, (node) => ({ ...node, props }));
};