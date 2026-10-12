"use client";

import { useDocumentStore } from "@/lib/document-store";
import { isPaletteDragData, PaletteDragData, parseContainerDropId } from "@/lib/palette-drag";
import { BuilderNode, NodeType } from "@/lib/schema";
import { findNode, findParent } from "@/lib/tree-operations";
import {
    CollisionDetection,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    pointerWithin,
    rectIntersection,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { ReactNode, useCallback, useMemo, useState } from "react";

type BuilderDndProviderProps = {
    children: ReactNode;
};

const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
        return pointerCollisions;
    }

    return rectIntersection(args);
}

const resolveDropTarget = (
    root: BuilderNode,
    overId: string,
): { parentId: string; index: number } | null => {
    const dropContainerId = parseContainerDropId(overId);

    if (dropContainerId !== null) {
        const container = findNode(root, dropContainerId);

        if (!container || container.type !== "container") {
            return null;
        }

        return {
            parentId: container.id,
            index: container.children.length,
        };
    }

    const overNode = findNode(root, overId);

    if (!overNode) {
        return null;
    }

    const parent = findParent(root, overId);

    if (!parent) {
        if (overNode.id === root.id && overNode.type === "container") {
            return {
                parentId: root.id,
                index: root.children.length,
            };
        }

        return null;
    }

    const index = parent.children.findIndex((child) => child.id === overId);

    if (index < 0) {
        return null;
    }

    return {
        parentId: parent.id,
        index,
    };
};

const readNodeTypeFromPaletteData = (data: PaletteDragData): NodeType => {
    return data.nodeType;
};

const BuilderDndProvider = ({
    children,
}: BuilderDndProviderProps) => {
    const { state, dispatch } = useDocumentStore();
    const root = state.document.root;
    const isEdit = state.ui.previewMode === "edit";

    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [paletteType, setPaletteType] = useState<NodeType | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        })
    );

    const activeNode = useMemo(() => {
        if (activeId === null || paletteType !== null) {
            return null;
        }

        return findNode(root, String(activeId));
    }, [activeId, paletteType, root]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        if (!isEdit) {
            return;
        }

        const data = event.active.data.current;

        if (isPaletteDragData(data)) {
            setPaletteType(readNodeTypeFromPaletteData(data));
        } else {
            setPaletteType(null);
        }

        setActiveId(event.active.id);
        dispatch({ type: "SET_DRAGGING", isDragging: true });
    }, [dispatch, isEdit]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveId(null);
        setPaletteType(null);
        dispatch({ type: "SET_DRAGGING", isDragging: false });

        if (!isEdit) {
            return;
        }

        const { active, over } = event;
        const data = active.data.current;

        if (!over ) {
            if (isPaletteDragData(data)) {
                dispatch({
                    type: "ADD_NODE",
                    parentId: root.id,
                    nodeType: data.nodeType,
                });
            }

            return;
        }

        const overNodeId = String(over.id);
        const target = resolveDropTarget(root, overNodeId);

        if (isPaletteDragData(data)) {
            dispatch({
                type: "ADD_NODE",
                parentId: target?.parentId ?? root.id,
                nodeType: data.nodeType,
                index: target?.index,
            });
            return;
        }

        const activeNodeId = String(active.id);

        if (activeNodeId === root.id || !target || activeNodeId === target.parentId) {
            return;
        }

        dispatch({
            type: "MOVE_NODE",
            nodeId: activeNodeId,
            toParentId: target.parentId,
            toIndex: target.index,
        });
    }, [dispatch, isEdit, root]);

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
        setPaletteType(null);
        dispatch({ type: "SET_DRAGGING", isDragging: false });
    }, [dispatch]);

    if (!isEdit) {
        return (
            <>
                {children}
            </>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            {children}
            <DragOverlay dropAnimation={null}>
                {paletteType ? (
                    <div className="rounded border border-blue-400 bg-white px-2 py-1 text-xs text-slate-700 shadow-md">
                        追加: {paletteType}
                    </div>
                ) : activeNode ? (
                    <div className="rounded border border-blue-400 bg-white px-2 py-1 text-xs text-slate-700 shadow-md">
                        {activeNode.type}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default BuilderDndProvider;