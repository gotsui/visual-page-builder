"use client";

import { useDocumentStore } from "@/lib/document-store";
import { Breakpoint, PreveiwMode } from "@/lib/schema";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import Palette from "./Palette";
import { Canvas } from "./Canvas";
import Inspector from "./Inspector";

const previewModes: PreveiwMode[] = ["edit", "preview"] as const;
const breakpoints: Breakpoint[] = ["base", "sm", "md", "lg"] as const;

const previewModeLabel: Record<PreveiwMode, string> = {
    edit: "編集",
    preview: "プレビュー",
};

const breakpointLabel: Record<Breakpoint, string> = {
    base: "Mobile",
    sm: "SM",
    md: "MD",
    lg: "LG",
};

const isPreviewMode = (value: string): value is PreveiwMode => {
    return previewModes.some((mode) => mode === value);
};

const isBreakpoint = (value: string): value is Breakpoint => {
    return breakpoints.some((bp) => bp === value);
};

const BuilderHeader = () => {
    const { state, dispatch, undo, redo, canUndo, canRedo } = useDocumentStore();
    const { document, ui } = state;

    const [localName, setLocalName] = useState(document.name);

    useEffect(() => {
        setLocalName(document.name);
    }, [document.name]);

    const commitName = useCallback(() => {
        const next = localName.trim();

        if (next.length === 0 || next === document.name) {
            setLocalName(document.name);
            return;
        }

        dispatch({ type: "UPDATE_PAGE_NAME", name: next });
    }, [dispatch, document.name, localName]);

    const handleModeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;

        if (isPreviewMode(value)) {
            dispatch({ type: "SET_PREVIEW_MODE", mode: value });
        }
    }, [dispatch]);

    const handleBreakpointChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;

        if (isBreakpoint(value)) {
            dispatch({ type: "SET_PREVIEW_BREAKPOINT", breakpoint: value });
        }
    }, [dispatch]);

    return (
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
            <input
                type="text"
                className={[
                    "min-w-0 flex-1 rounded border border-transparent bg-transparent px-2 py-1",
                    "text-sm font-medium text-slate-800 outline-none",
                    "hover:border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400",
                ].join(" ")}
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.currentTarget.blur();
                    }
                }}
                aria-label="ページ名"
            />
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40"
                    disabled={!canUndo}
                    onClick={undo}
                >
                    Undo
                </button>
                <button
                    type="button"
                    className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40"
                    disabled={!canRedo}
                    onClick={redo}
                >
                    Redo
                </button>
            </div>
            <label className="flex items-center gap-1 text-xs text-slate-500">
                モード
                <select
                    className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700"
                    value={ui.previewMode}
                    onChange={handleModeChange}
                >
                    {previewModes.map((mode) => (
                        <option key={mode} value={mode}>
                            {previewModeLabel[mode]}
                        </option>
                    ))}
                </select>
            </label>
            <label className="flex items-center gap-1 text-xs text-slate-500">
                幅
                <select
                    className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700"
                    value={ui.previewBreakpoint}
                    onChange={handleBreakpointChange}
                >
                    {breakpoints.map((bp) => (
                        <option key={bp} value={bp}>
                            {breakpointLabel[bp]}
                        </option>
                    ))}
                </select>
            </label>
        </header>
    );
};

const BuilderShell = () => {
    return (
        <div className="flex h-screen flex-col bg-white text-slate-900">
            <BuilderHeader />
            <div className="flex -min-h-0 flex-1">
                <Palette />
                <Canvas />
                <Inspector />
            </div>
        </div>
    );
};

export default BuilderShell;