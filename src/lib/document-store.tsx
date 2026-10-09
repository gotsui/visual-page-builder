"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { createEmptyPageDocument } from "./document-factory";
import { Breakpoint, BuilderNode, NodeType, PageDocument, PageLayout, PreveiwMode, UiState, UiStateSchema } from "./schema";
import { addNode, moveNode, NodePatch, removeNode, replaceNodeProps, updateNode } from "./tree-operations";
import { createNodeFromRegistry } from "./component-registry";

export type DocumentState = {
    document: PageDocument;
    past: PageDocument[];
    future: PageDocument[];
    ui: UiState;
};

const MAX_HISTORY = 50;

export const createInitialUi = (): UiState => {
    return UiStateSchema.parse({});
};

export const createInitialState = (
    document?: PageDocument,
): DocumentState => {
    return {
        document: document ?? createEmptyPageDocument(),
        past: [],
        future: [],
        ui: createInitialUi(),
    };
};

export type DocumentAction =
    | { type: "SELECT_NODE"; nodeId: string | null }
    | { type: "SET_HOVERED_NODE"; nodeId: string | null }
    | { type: "SET_PREVIEW_MODE"; mode: PreveiwMode }
    | { type: "SET_PREVIEW_BREAKPOINT"; breakpoint: Breakpoint }
    | { type: "SET_DRAGGING"; isDragging: boolean }
    | { type: "ADD_NODE"; parentId: string; nodeType: NodeType; index?: number }
    | { type: "ADD_NODE_INSTANCE"; parentId: string; node: BuilderNode; index?: number }
    | { type: "REMOVE_NODE"; nodeId: string }
    | { type: "MOVE_NODE"; nodeId: string; toParentId: string; toIndex: number }
    | { type: "UPDATE_NODE"; nodeId: string; patch: NodePatch }
    | { type: "REPLACE_NODE_PROPS"; nodeId: string; props: Record<string, unknown> }
    | { type: "UPDATE_PAGE_NAME"; name: string }
    | { type: "UPDATE_PAGE_LAYOUT"; pageLayout: Partial<PageLayout> }
    | { type: "LOAD_DOCUMENT"; document: PageDocument }
    | { type: "RESET_DOCUMENT"; name?: string }
    | { type: "UNDO" }
    | { type: "REDO" };

type ActionType = DocumentAction["type"];

type ActionPayload<T extends ActionType> = Omit<Extract<DocumentAction, { type: T }>, "type">;

const pushHistory = (
    state: DocumentState,
    nextDocument: PageDocument,
): DocumentState => {
    if (nextDocument === state.document) {
        return state;
    }

    const past = [...state.past, state.document ].slice(-MAX_HISTORY);

    return {
        ...state,
        document: {
            ...nextDocument,
            updatedAt: new Date().toISOString(),
        },
        past,
        future: [],
    };
};

type ActionHandlerMap = {
    [K in ActionType]: (
        state: DocumentState,
        payload: ActionPayload<K>
    ) => DocumentState;
};

const actionHandlers: ActionHandlerMap = {
    SELECT_NODE: (state, { nodeId }) => ({
        ...state,
        ui: { ...state.ui, selectedNodeId: nodeId },
    }),
    SET_HOVERED_NODE: (state, { nodeId }) => ({
        ...state,
        ui: { ...state.ui, hoveredNodeId: nodeId },
    }),
    SET_PREVIEW_MODE: (state, { mode }) => ({
        ...state,
        ui: { ...state.ui, previewMode: mode }
    }),
    SET_PREVIEW_BREAKPOINT: (state, { breakpoint }) => ({
        ...state,
        ui: { ...state.ui, previewBreakpoint: breakpoint }
    }),
    SET_DRAGGING: (state, { isDragging }) => ({
        ...state,
        ui: { ...state.ui, isDragging },
    }),
    ADD_NODE: (state, { parentId, nodeType, index }) => {
        const node = createNodeFromRegistry(nodeType);
        const nextRoot = addNode(state.document.root, parentId, node, index);

        if (nextRoot === state.document.root) {
            return state;
        }

        const withDoc = pushHistory(state, {
            ...state.document,
            root: nextRoot,
        });

        return {
            ...withDoc,
            ui: { ...withDoc.ui, selectedNodeId: node.id },
        };
    },
    ADD_NODE_INSTANCE: (state, { parentId, node, index }) => {
        const nextRoot = addNode(state.document.root, parentId, node, index);

        if (nextRoot === state.document.root) {
            return state;
        }

        const withDoc = pushHistory(state, {
            ...state.document,
            root: nextRoot,
        });

        return {
            ...withDoc,
            ui: { ...withDoc.ui, selectedNodeId: node.id },
        };
    },
    REMOVE_NODE: (state, { nodeId }) => {
        if (nodeId === state.document.root.id) {
            return state;
        }

        const nextRoot = removeNode(state.document.root, nodeId);

        if (nextRoot === state.document.root) {
            return state;
        }

        const withDoc = pushHistory(state, {
            ...state.document,
            root: nextRoot,
        });

        const selected = state.ui.selectedNodeId === nodeId ? null : state.ui.selectedNodeId;

        return {
            ...withDoc,
            ui: { ...withDoc.ui, selectedNodeId: selected },
        };
    },
    MOVE_NODE: (state, { nodeId, toParentId, toIndex }) => {
        const nextRoot = moveNode(state.document.root, nodeId, toParentId, toIndex);

        if (nextRoot === state.document.root) {
            return state;
        }

        return pushHistory(state, {
            ...state.document,
            root: nextRoot,
        });
    },
    UPDATE_NODE: (state, { nodeId, patch }) => {
        const nextRoot = updateNode(state.document.root, nodeId, patch);

        if (nextRoot === state.document.root) {
            return state;
        }

        return pushHistory(state, {
            ...state.document,
            root: nextRoot,
        });
    },
    REPLACE_NODE_PROPS: (state, { nodeId, props }) => {
        const nextRoot = replaceNodeProps(state.document.root, nodeId, props);

        if (nextRoot === state.document.root) {
            return state;
        }

        return pushHistory(state, {
            ...state.document,
            root: nextRoot,
        });
    },
    UPDATE_PAGE_NAME: (state, { name }) => {
        if (name === state.document.name) {
            return state;
        }

        return pushHistory(state, {
            ...state.document,
            name,
        });
    },
    UPDATE_PAGE_LAYOUT: (state, { pageLayout }) => {
        const nextLayout: PageLayout = {
            ...state.document.pageLayout,
            ...pageLayout,
        };

        return pushHistory(state, {
            ...state.document,
            pageLayout: nextLayout,
        });
    },
    LOAD_DOCUMENT: (_state, { document }) => ({
        document,
        past: [],
        future: [],
        ui: {
            ...createInitialUi(),
            selectedNodeId: null,
        },
    }),
    RESET_DOCUMENT: (_state, { name }) => {
        return createInitialState(createEmptyPageDocument(name));
    },
    UNDO: (state) => {
        if (state.past.length === 0) {
            return state;
        }

        const previous = state.past[state.past.length - 1];

        return {
            ...state,
            document: previous,
            past: state.past.slice(0, -1),
            future: [state.document, ...state.future],
            ui: { ...state.ui, selectedNodeId: null },
        };
    },
    REDO: (state) => {
        if (state.future.length === 0) {
            return state;
        }

        const next = state.future[0];

        return {
            ...state,
            document: next,
            past: [...state.past, state.document],
            future: state.future.slice(1),
            ui: { ...state.ui, selectedNodeId: null },
        };
    },
};

const documentReducer = <K extends ActionType>(
    state: DocumentState,
    action: Extract<DocumentAction, { type: K }>,
): DocumentState => {
    const handler = actionHandlers[action.type];

    if (!handler) {
        return state;
    }

    return handler(state, action);
};

type DocumentContextValue = {
    state: DocumentState;
    dispatch: React.Dispatch<DocumentAction>;
    selectNode: (nodeId: string | null) => void;
    addNodeType: (parentId: string, nodeType: NodeType, index?: number) => void;
    removeSelectedNode: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
};

const DocumentContext = createContext<DocumentContextValue | null>(null);

type DocumentProviderProps = {
    children: ReactNode;
    initialDocument?: PageDocument;
};

export const DocumentProvider = ({
    children,
    initialDocument,
}: DocumentProviderProps) => {
    const [state, dispatch] = useReducer(
        documentReducer,
        initialDocument,
        () => createInitialState(initialDocument),
    );
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const selectNode = useCallback((nodeId: string | null) => {
        dispatch({ type: "SELECT_NODE", nodeId });
    }, []);

    const addNodeType = useCallback((parentId: string, nodeType: NodeType, index?: number) => {
        dispatch({ type: "ADD_NODE", parentId, nodeType, index });
    }, []);

    const removeSelectedNode = useCallback(() => {
        if (state.ui.selectedNodeId) {
            dispatch({ type: "REMOVE_NODE", nodeId: state.ui.selectedNodeId });
        }
    }, [state.ui.selectedNodeId]);

    const undo = useCallback(() => {
        dispatch({ type: "UNDO" });
    }, []);

    const redo = useCallback(() => {
        dispatch({ type: "REDO" });
    }, []);

    const value = useMemo<DocumentContextValue>(
        () => ({
            state,
            dispatch,
            selectNode,
            addNodeType,
            removeSelectedNode,
            undo,
            redo,
            canUndo: state.past.length > 0,
            canRedo: state.future.length > 0,
        }),
        [state, selectNode, addNodeType, removeSelectedNode, undo, redo]
    );

    if (!hasMounted) {
        return (
            <div className="flex justify-center" aria-label="読み込み中">
                <div className="animate-ping h-4 w-4 bg-blue-600 rounded-full"></div>
            </div>
        );
    };

    return (
        <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>
    );
};

export const useDocumentStore = (): DocumentContextValue => {
    const ctx = useContext(DocumentContext);

    if (!ctx) {
        throw new Error("useDocumentStore は DocumentProvider 内で使用してください");
    }

    return ctx;
};

export const useDocument = (): PageDocument => {
    return useDocumentStore().state.document;
};

export const useDocumentUi = (): UiState => {
    return useDocumentStore().state.ui;
};

export const useSelectedNode = (): BuilderNode | null => {
    const { state } = useDocumentStore();
    const id = state.ui.selectedNodeId;

    if (!id) {
        return null;
    }

    const find = (node: BuilderNode): BuilderNode | null => {
        if (node.id === id) {
            return node;
        }

        for (const child of node.children) {
            const found = find(child);

            if (found) {
                return found;
            }
        }

        return null;
    };

    return find(state.document.root);
};