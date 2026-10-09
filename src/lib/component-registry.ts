import { BuilderNode, createDefaultLayout, createDefaultStyle, NodeType } from "./schema";

export type PaletteCategory = "basic" | "form" | "layout";

export type ComponentDefinition = {
    type: NodeType;
    label: string;
    description?: string;
    category: PaletteCategory;
    canHaveChildren: boolean;
    createDefault: () => Omit<BuilderNode, "id">;
};

export const componentRegistry: Record<NodeType, ComponentDefinition> = {
    container: {
        type: "container",
        label: "グループ",
        description: "要素をまとめるコンテナ",
        category: "layout",
        canHaveChildren: true,
        createDefault: () => ({
            type: "container",
            props: {},
            style: createDefaultStyle(),
            layout: createDefaultLayout(),
            children: [],
        }),
    },
    text: {
        type: "text",
        label: "テキスト",
        description: "見出しや本文",
        category: "basic",
        canHaveChildren: false,
        createDefault: () => ({
            type: "text",
            props: { content: "テキスト", tag: "p" },
            style: createDefaultStyle(),
            children: [],
        }),
    },
    button: {
        type: "button",
        label: "ボタン",
        category: "basic",
        canHaveChildren: false,
        createDefault: () => ({
            type: "button",
            props: { label: "ボタン", variant: "primary" },
            style: createDefaultStyle(),
            children: [],
        }),
    },
    image: {
        type: "image",
        label: "画像",
        category: "basic",
        canHaveChildren: false,
        createDefault: () => ({
            type: "image",
            props: { src: "", alt: "", objectFit: "cover" },
            style: createDefaultStyle(),
            children: [],
        }),
    },
    input: {
        type: "input",
        label: "入力欄",
        category: "form",
        canHaveChildren: false,
        createDefault: () => ({
            type: "input",
            props: { placeholder: "", inputType: "text" },
            style: createDefaultStyle(),
            children: [],
        }),
    },
    spacer: {
        type: "spacer",
        label: "スペース",
        description: "縦方向の余白",
        category: "layout",
        canHaveChildren: false,
        createDefault: () => ({
            type: "spacer",
            props: { size: 16 },
            style: createDefaultStyle(),
            children: [],
        }),
    },
};

export const categoryOrder: PaletteCategory[] = ["basic", "layout", "form"];

export const getPaletteItems = (): ComponentDefinition[] => {
    return categoryOrder.flatMap(
        (category) => Object.values(componentRegistry).filter((def) => def.category === category)
    );
};

export const getComponentDefinition = (type: NodeType): ComponentDefinition => {
    const def = componentRegistry[type];

    if (!def) {
        throw new Error(`未登録のノード種別: ${type}`);
    }

    return def;
};

export const createNodeFromRegistry = (type: NodeType): BuilderNode => {
    const def = getComponentDefinition(type);

    return {
        id: crypto.randomUUID(),
        ...def.createDefault(),
    };
};

export const categoryLabelMap: Record<PaletteCategory, string> = {
    basic: "基本",
    layout: "レイアウト",
    form: "フォーム",
};