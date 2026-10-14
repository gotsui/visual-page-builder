"use client";

import { useDocumentStore } from "@/lib/document-store";
import { MouseEvent } from "react";
import NodeRenderer from "./NodeRenderer";
import { pageLayoutToCssObject } from "@/lib/node-view-model";

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
    const isEmpty = document.root.children.length === 0;

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
                    className="flex flex-col min-h-120 bg-white shadow-sm transition-[width] duration-200"
                    style={{
                        width: "100%",
                        maxWidth: previewWidth,
                    }}
                >
                    <div
                        className="relative flex-1 min-h-120 w-full"
                        style={pageLayoutToCssObject(document.pageLayout)}
                        onClick={handleBackgroundClick}
                        role="presentation"
                    >
                        <NodeRenderer node={document.root} isRoot />
                        {isEdit && isEmpty ? (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <p className="text-sm text-slate-400">
                                    パレットから要素をドラッグまたはクリックで追加
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </main>
    );
};