"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CSSProperties, ReactNode } from "react";

type SortableNodeProps = {
    id: string;
    disabled?: boolean;
    children: ReactNode;
};

const SortableNode = ({
    id,
    disabled = false,
    children,
}: SortableNodeProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: "relative",
    };

    if (disabled) {
        return (
            <div ref={setNodeRef}>
                {children}
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="touch-none"
            {...attributes}
            {...listeners}
        >
            {children}
        </div>
    );
};

export default SortableNode;