"use client";

import { containerDropId } from "@/lib/palette-drag";
import { useDroppable } from "@dnd-kit/core";
import { CSSProperties, ReactNode } from "react";

type DroppableContainerProps = {
    nodeId: string;
    style?: CSSProperties;
    className?: string;
    disabled?: boolean;
    children?: ReactNode;
};

const DroppableContainer = ({
    nodeId,
    style,
    className,
    disabled = false,
    children,
}: DroppableContainerProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: containerDropId(nodeId),
        disabled,
        data: {
            type: "container-drop",
            nodeId,
        },
    });

    const overClass = isOver && !disabled ? "ring-2 ring-blue-400 ring-inset" : "";

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`min-h-8 min-w-8 ${overClass} ${className ?? ""}`}
        >
            {children}
        </div>
    );
};

export default DroppableContainer;