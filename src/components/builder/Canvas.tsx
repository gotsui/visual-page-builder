"use client";

import { useDocumentStore } from "@/lib/document-store";
import { Align, PageLayout } from "@/lib/schema";
import { CSSProperties, MouseEvent } from "react";
import NodeRenderer from "./NodeRenderer";

const pageJustifyMap: Record<PageLayout["justify"], CSSProperties["justifyContent"]> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
};

const pageAlignMap: Record<Align, CSSProperties["alignItems"]> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
};

const spacingToPx = (value: number): string => {
    return `${value * 4}px`;
};

const pageLayoutToCss = (pageLayout: PageLayout): CSSProperties => {
    const style: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: pageLayout.maxWidth,
        padding: spacingToPx(pageLayout.padding),
        justifyContent: pageJustifyMap[pageLayout.justify],
        alignItems: pageAlignMap[pageLayout.align],
        boxSizing: "border-box",
    };

    if (pageLayout.background !== undefined) {
        style.backgroundColor = pageLayout.background;
    }

    return style;
};

const breakpointWidthMap = {
    base: 375,
    sm: 640,
    md: 768,
    lg: 1024,
} as const;

export const Canvas = () => {
    const { state, selectNode } = useDocumentStore();
    const { document, ui } = state;
    const isEdit = ui.previewMode === "edit";
    const previewWidth = breakpointWidthMap[ui.previewBreakpoint];

    const handleBackgroundClick = (event: MouseEvent<HTMLDivElement>) => {
        if (!isEdit) {
            return;
        }

        if (event.target === event.currentTarget) {
            selectNode(null);
        }
    };

    return (
        <main className="flex min-h-0 flex-1 flex-col overflow-auto bg-slate-100">
            <div className="flex flex-1 justify-center p-6">
                <div
                    className="min-h-120 bg-white shadow-sm transition-[width] duration-200"
                    style={{
                        width: "100%",
                        maxWidth: previewWidth,
                    }}
                >
                    <div
                        className="min-h-120 w-full"
                        style={pageLayoutToCss(document.pageLayout)}
                        onClick={handleBackgroundClick}
                        role="presentation"
                    >
                        <NodeRenderer node={document.root} isRoot />
                    </div>
                </div>
            </div>
        </main>
    );
};