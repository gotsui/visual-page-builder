"use client";

import { useDocumentStore } from "@/lib/document-store";
import { BuilderNode } from "@/lib/schema";
import { findNode, findParent } from "@/lib/tree-operations";
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, UniqueIdentifier, useSensor, useSensors } from "@dnd-kit/core";
import { ReactNode, useCallback, useMemo, useState } from "react";

type BuilderDndProviderProps = {
    children: ReactNode;
};

const resolveDropTarget = (
    root: BuilderNode,
    activeId: string,
    overId: string,
): { parentId: string; index: number } | null => {
    if (activeId === overId) {
        return null;
    }

    const overNode = findNode(root, overId);

    if (!overNode) {
        return null;
    }

    if (overNode.type === "container") {
        return {
            parentId: overNode.id,
            index: overNode.children.length,
        };
    }

    const parent = findParent(root, overId);

    if (!parent) {
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

const BuilderDndProvider = ({
    children,
}: BuilderDndProviderProps) => {
    const { state, dispatch } = useDocumentStore();
    const root = state.document.root;
    const isEdit = state.ui.previewMode === "edit";

    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 0 },
        })
    );

    const activeNode = useMemo(() => {
        if (activeId === null) {
            return;
        }

        return findNode(root, String(activeId));
    }, [activeId, root]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        if (!isEdit) {
            return;
        }

        setActiveId(event.active.id);
        dispatch({ type: "SET_DRAGGING", isDragging: true });
    }, [dispatch, isEdit]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveId(null);
        dispatch({ type: "SET_DRAGGING", isDragging: false });

        if (!isEdit) {
            return;
        }

        const { active, over } = event;

        if (!over) {
            return;
        }

        const activeNodeId = String(active.id);
        const overNodeId = String(over.id);

        if (activeNodeId === root.id) {
            return;
        }

        const target = resolveDropTarget(root, activeNodeId, overNodeId);

        if (!target) {
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
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            {children}
            <DragOverlay dropAnimation={null}>
                {activeNode ? (
                    <div className="rounded border border-blue-400 bg-white px-2 py-1 text-xs text-slate-700 shadow-md">
                        {activeNode.type}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default BuilderDndProvider;