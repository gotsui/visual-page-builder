"use client";

import {
    categoryLabelMap,
    categoryOrder,
    ComponentDefinition,
    getPaletteItems,
    PaletteCategory,
} from "@/lib/component-registry";
import { useDocumentStore } from "@/lib/document-store";
import { PaletteDragData } from "@/lib/palette-drag";
import { NodeType } from "@/lib/schema";
import { useDraggable } from "@dnd-kit/core";

const groupByCategory = (
    items: ComponentDefinition[],
): Record<PaletteCategory, ComponentDefinition[]> => {
    const initial: Record<PaletteCategory, ComponentDefinition[]> = {
        basic: [],
        layout: [],
        form: [],
    };

    return items.reduce((acc, item) => {
        acc[item.category].push(item);
        return acc;
    }, initial);
};

type PaletteItemProps = {
    item: ComponentDefinition;
    rootId: string;
    onAdd: (parentId: string, nodeType: NodeType) => void;
};

const PaletteItem = ({
    item,
    rootId,
    onAdd,
}: PaletteItemProps) => {
    const dragId = `palette:${item.type}`;

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: dragId,
        data: {
            source: "palette",
            nodeType: item.type,
        } satisfies PaletteDragData,
    });

    return (
        <li>
            <button
                ref={setNodeRef}
                type="button"
                className={[
                    "flex w-full flex-col items-start rounded-md border border-slate-200",
                    "bg-white px-3 py-2 text-left text-sm text-slate-700 shadow-sm transition",
                    "hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100",
                    `${isDragging ? "opacity-40" : ""}`,
                ].join(" ")}
                title={item.description ?? item.label}
                onClick={() => onAdd(rootId, item.type)}
                {...listeners}
                {...attributes}
            >
                <span className="font-medium">{item.label}</span>
                {item.description ? (
                    <span className="mt-0.5 text-xs text-slate-400">
                        {item.description}
                    </span>
                ) : null}
            </button>
        </li>
    );
};

const Palette = () => {
    const { state, addNodeType } = useDocumentStore();
    const rootId = state.document.root.id;
    const grouped = groupByCategory(getPaletteItems());

    const categoryList = categoryOrder.filter((key) => grouped[key].length > 0);

    return (
        <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-200">
            <div className="border-b border-slate-200 px-3 py-2">
                <h2 className="text-sm font-semibold text-slate-700">パレット</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                    クリックでキャンバスに追加
                </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {categoryList.map((category) => (
                    <section key={category} className="mb-4">
                        <h3 className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                            {categoryLabelMap[category]}
                        </h3>
                        <ul className="flex flex-col gap-1">
                            {grouped[category].map((item) => (
                                <PaletteItem
                                    key={item.type}
                                    item={item}
                                    rootId={rootId}
                                    onAdd={addNodeType}
                                />
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </aside>
    );
};

export default Palette;