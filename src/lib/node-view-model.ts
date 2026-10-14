import { CSSProperties } from "react";
import {
    Align,
    Breakpoint,
    BuilderNode,
    Justify,
    LayoutConfig,
    NodeType,
    PageLayout,
    ResponsiveStyle,
    StyleValue,
} from "./schema";

export const readStringProp = (
  props: Record<string, unknown>,
  key: string,
  fallback: string,
): string => {
  const value = props[key];
  return typeof value === "string" ? value : fallback;
};

export const readNumberProp = (
  props: Record<string, unknown>,
  key: string,
  fallback: number,
): number => {
  const value = props[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

export const justifyMap: Record<Justify, CSSProperties["justifyContent"]> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    between: "space-between",
    around: "space-around",
};

export const alignMap: Record<Align, CSSProperties["alignItems"]> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
};

export const spacingToPx = (value: number): string => {
    return `${value * 4}px`;
};

export const layoutToCssObject = (layout: LayoutConfig | undefined): CSSProperties => {
    if (!layout) {
        return {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
        };
    }

    return {
        display: "flex",
        flexDirection: layout.direction,
        justifyContent: justifyMap[layout.justify],
        alignItems: alignMap[layout.align],
        gap: spacingToPx(layout.gap),
        flexWrap: layout.wrap ? "wrap" : "nowrap",
    };
};

export const styleValueToCssObject = (value: StyleValue): CSSProperties => {
    const css: CSSProperties = {};

    css.width = value.width ? value.width : undefined;
    css.height = value.height ? value.height : undefined;
    css.minWidth = value.minWidth ? value.minWidth : undefined;
    css.maxWidth = value.maxWidth ? value.maxWidth : undefined;
    css.minHeight = value.minHeight ? value.minHeight : undefined;
    css.maxHeight = value.maxHeight ? value.maxHeight : undefined;
    css.margin = value.margin ? value.margin : undefined;
    css.marginTop = value.marginTop ? value.marginTop : undefined;
    css.marginRight = value.marginRight ? value.marginRight : undefined;
    css.marginBottom = value.marginBottom ? value.marginBottom : undefined;
    css.marginLeft = value.marginLeft ? value.marginLeft : undefined;
    css.padding = value.padding ? value.padding : undefined;
    css.paddingTop = value.paddingTop ? value.paddingTop : undefined;
    css.paddingBottom = value.paddingBottom ? value.paddingBottom : undefined;
    css.paddingLeft = value.paddingLeft ? value.paddingLeft : undefined;
    css.backgroundColor = value.backgroundColor ? value.backgroundColor : undefined;
    css.color = value.color ? value.color : undefined;
    css.fontSize = value.fontSize ? value.fontSize : undefined;
    css.fontWeight = value.fontWeight ? value.fontWeight : undefined;
    css.textAlign = value.textAlign ? value.textAlign : undefined;
    css.borderWidth = value.borderWidth ? value.borderWidth : undefined;
    css.borderStyle = value.borderStyle ? value.borderStyle : undefined;
    css.borderColor = value.borderColor ? value.borderColor : undefined;
    css.borderRadius = value.borderRadius ? value.borderRadius : undefined;

    return css;
};

export const resolveStyle = (style: ResponsiveStyle, breakpoint: Breakpoint): StyleValue => {
    const order: Breakpoint[] = ["lg", "md", "sm", "base"];
    const endIndex = order.indexOf(breakpoint);

    return order.slice(0, endIndex + 1).reduce<StyleValue>((acc, key) => {
        const layer = style[key];

        if (!layer) {
            return acc;
        }

        return { ...acc, ...layer };
    }, {});
};

export const pageLayoutToCssObject = (pageLayout: PageLayout): CSSProperties => {
    const style: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: pageLayout.maxWidth,
        padding: spacingToPx(pageLayout.padding),
        justifyContent: justifyMap[pageLayout.justify],
        alignItems: alignMap[pageLayout.align],
        boxSizing: "border-box",
    };

    if (pageLayout.background !== undefined) {
        style.backgroundColor = pageLayout.background;
    }

    return style;
};

export const mergeCss = (...parts: Array<CSSProperties | undefined>): CSSProperties => {
    let result: CSSProperties = {};

    for (const part of parts) {
        if (!part) {
            continue;
        }

        result = { ...result, ...part };
    }

    return result;
};

export const sanitizeCss = (css: CSSProperties): CSSProperties => {
    const result: CSSProperties = {};

    for (const [key, value] of Object.entries(css)) {
        if (value === undefined || value === null) {
            continue;
        }

        if (typeof value === "object") {
            continue;
        }

        if (typeof value === "string" && value.length === 0) {
            continue;
        }

        if (value === "undefined" || value === "null") {
            continue;
        }

        Object.assign(result, { [key]: value });
    }

    return result;
};

export const cssObjectToInline = (css: CSSProperties): string => {
    return Object.entries(sanitizeCss(css)).map(([key, value]) => {
        const kebab = key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
        return `${kebab}: ${value}`;
    }).join("; ");
};

export type NodeViewModel = {
    type: NodeType;
    tag: string;
    attrs: Record<string, string>;
    css: CSSProperties;
    text?: string;
    selfClosing: boolean;
    children: BuilderNode[];
};

export const textTags = ["p", "h1", "h2", "h3", "h4", "span"] as const;
export const textTagSet: ReadonlySet<string> = new Set(textTags);

const objectFits = ["contain", "cover", "fill", "none", "scale-down"] as const;
type ObjectFitValue = (typeof objectFits)[number];

export const toObjectFit = (value: string): ObjectFitValue => {
    for (const candidate of objectFits) {
        if (candidate === value) {
            return candidate;
        }
    }

    return "cover";
};

const buildContainerView = (
    node: BuilderNode,
    styleCss: CSSProperties,
): NodeViewModel => {
    return {
        type: "container",
        tag: "div",
        attrs: {},
        css: mergeCss(styleCss, layoutToCssObject(node.layout)),
        selfClosing: false,
        children: node.children,
    };
};

const buildTextView = (
    node: BuilderNode,
    styleCss: CSSProperties,
): NodeViewModel => {
    const tag = readStringProp(node.props, "tag", "p");

    return {
        type: "text",
        tag: textTagSet.has(tag) ? tag : "p",
        attrs: {},
        css: styleCss,
        text: readStringProp(node.props, "content", ""),
        selfClosing: false,
        children: [],
    };
};

const buildButtonView = (
    node: BuilderNode,
    styleCss: CSSProperties,
): NodeViewModel => {
    return {
        type: "button",
        tag: "button",
        attrs: {
            type: "button",
            "data-variant": readStringProp(node.props, "variant", "primary"),
        },
        css: styleCss,
        text: readStringProp(node.props, "label", "ボタン"),
        selfClosing: false,
        children: [],
    };
};

const buildImageView = (
    node: BuilderNode,
    styleCss: CSSProperties,
): NodeViewModel => {
    const src = readStringProp(node.props, "src", "");
    const alt = readStringProp(node.props, "alt", "");
    const objectFitRaw = readStringProp(node.props, "objectFit", "cover");

    if (!src) {
        return {
            type: "image",
            tag: "div",
            attrs: {},
            css: styleCss,
            text: "画像未設定",
            selfClosing: false,
            children: [],
        };
    }

    return {
        type: "image",
        tag: "img",
        attrs: { src, alt },
        css: { ...styleCss, objectFit: toObjectFit(objectFitRaw) },
        selfClosing: true,
        children: [],
    };
};

const buildInputView = (
    node: BuilderNode,
    styleCss: CSSProperties,
): NodeViewModel => {
    return {
        type: "input",
        tag: "input",
        attrs: {
            type: readStringProp(node.props, "inputType", "text"),
            placeholder: readStringProp(node.props, "placeholder", ""),
        },
        css: styleCss,
        selfClosing: true,
        children: [],
    };
};

const buildSpacerView = (
    node: BuilderNode,
    styleCss: CSSProperties,
): NodeViewModel => {
    const size = readNumberProp(node.props, "size", 16);

    return {
        type: "spacer",
        tag: "div",
        attrs: { "aria-hidden": "true" },
        css: mergeCss(styleCss, {
            height: `${size}px`,
            width: "100%",
        }),
        selfClosing: true,
        children: [],
    };
};

const viewBuilders: Record<NodeType, (node: BuilderNode, styleCss: CSSProperties) => NodeViewModel> = {
    container: buildContainerView,
    text: buildTextView,
    button: buildButtonView,
    image: buildImageView,
    input: buildInputView,
    spacer: buildSpacerView,
};

export const toNodeViewModel = (
    node: BuilderNode,
    breakpoint: Breakpoint = "lg",
): NodeViewModel => {
    const resolved = resolveStyle(node.style, breakpoint);
    const styleCss = styleValueToCssObject(resolved);
    const view = viewBuilders[node.type](node, styleCss);
    return {
        ...view,
        css: sanitizeCss(view.css),
    };
};