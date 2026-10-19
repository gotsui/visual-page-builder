"use client";

import { CodegenFormat, codegenFormats, generateCode } from "@/lib/code-generate";
import { useDocument } from "@/lib/document-store";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

const formatLabel: Record<CodegenFormat, string> = {
    html: "HTML",
    jsx: "JSX",
    tailwind: "Tailwind",
};

const isCodegenFormat = (value: string): value is CodegenFormat => {
    return codegenFormats.some((format) => format === value);
};

type CodeExportPanelProps = {
    open: boolean;
    onClose: () => void;
};

const CodeExportPanel = ({
    open,
    onClose,
}: CodeExportPanelProps) => {
    const document = useDocument();
    const [format, setFormat] = useState<CodegenFormat>("html");
    const [copied, setCopied] = useState(false);

    const code = useMemo(() => generateCode(
        document,
        { format, includePageWrapper: true },
    ), [document, format]);

    useEffect(() => {
        if (!open) {
            setCopied(false);
        }
    }, [open]);

    useEffect(() => {
        setCopied(false);
    }, [format, code]);

    const handleFormatChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;

        if (isCodegenFormat(value)) {
            setFormat(value);
        }
    }, []);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    }, [code]);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
                className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="code-export-title"
            >
                <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                    <h2
                        id="code-export-title"
                        className="text-sm font-semibold text-slate-800"
                    >
                        コード出力
                    </h2>
                    <label className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                        形式
                        <select
                            className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700"
                            value={format}
                            onChange={handleFormatChange}
                        >
                            {codegenFormats.map((item) => (
                                <option key={item} value={item}>
                                    {formatLabel[item]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        onClick={handleCopy}
                    >
                        {copied ? "コピーしました" : "コピー"}
                    </button>
                    <button
                        type="button"
                        className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
                        onClick={onClose}
                    >
                        閉じる
                    </button>
                </div>
                <pre className="min-h-0 flex-1 overflow-auto bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
};

export default CodeExportPanel;