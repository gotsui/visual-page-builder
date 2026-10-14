import { CSSProperties } from "react";
import { alignMap, cssObjectToInline, justifyMap, layoutToCssObject, mergeCss, readNumberProp, readStringProp, sanitizeCss, spacingToPx, styleValueToCssObject, textTagSet, toObjectFit } from "./node-view-model";
import { BuilderNode, NodeType, PageDocument, ResponsiveStyle, StyleValue } from "./schema";

export const codegenFormats = ["html", "jsx"] as const;
export type CodegenFormat = (typeof codegenFormats)[number];

export type CodegenOptions = {
    format?: CodegenFormat;
    indentSize?: number;
    includePageWrapper?: boolean;
};

const escapeHtml = (text: string): string => {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
};

const escapeJsxText = (text: string): string => {
    return text
        .replaceAll("{", "&#123;")
        .replaceAll("}", "&#125;");
};

const cssObjectToJsx = (css: CSSProperties): string => {
    const clean = sanitizeCss(css);
    const entries = Object.entries(clean);

    if (entries.length === 0) {
        return "{{}}";
    }

    const body = entries
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(", ");
    return `{{ ${body} }}`;
};

type EmitContext = {
    format: CodegenFormat;
    indentSize: number;
};

const openTag = (
    tag: string,
    attrs: Record<string, string | undefined>,
    css: CSSProperties,
    ctx: EmitContext,
    selfClosing: boolean,
): string => {
    const attrParts: string[] = [];

    for (const [key, value] of Object.entries(attrs)) {
        if (value === undefined) {
            continue;
        }

        if (ctx.format === "html") {
            attrParts.push(`${key}="${escapeHtml(value)}"`);
        } else {
            const jsxKey = key === "class" ? "className" : key;
            attrParts.push(`${jsxKey}=${JSON.stringify(value)}`);
        }
    }

    const cleanCss = sanitizeCss(css);
    const hasCss = Object.keys(cleanCss).length > 0;

    if (hasCss) {
        if (ctx.format === "html") {
            attrParts.push(`style="${escapeHtml(cssObjectToInline(cleanCss))}"`);
        } else {
            attrParts.push(`style=${cssObjectToJsx(cleanCss)}`);
        }
    }

    const attrStr = attrParts.length > 0 ? ` ${attrParts.join(" ")}` : "";

    if (selfClosing) {
        return ctx.format === "html" ? `<${tag}${attrStr} />` : `<${tag}${attrStr} />`;
    }

    return `<${tag}${attrStr}>`;
};

const resolveBaseStyle = (style: ResponsiveStyle): StyleValue => {
    return style.base ?? {};
};

const emitNode = (
    node: BuilderNode,
    ctx: EmitContext,
    depth: number,
): string => {
    const pad = " ".repeat(ctx.indentSize * depth);
    const base = resolveBaseStyle(node.style);
    const baseCss = styleValueToCssObject(base);

    const emitChildren = (children: BuilderNode[]): string => {
        if (children.length === 0) {
            return "";
        }

        return children.map((child) => emitNode(child, ctx, depth + 1)).join("\n");
    };

    const emitters: Record<NodeType, () => string> = {
        container: () => {
            const css = mergeCss(baseCss, layoutToCssObject(node.layout));
            const open = openTag("div", {}, css, ctx, false);
            const inner = emitChildren(node.children);

            if (!inner) {
                return `${pad}${open}</div>`
            }

            return `${pad}${open}\n${inner}\n${pad}</div>`;
        },
        text: () => {
            const content = readStringProp(node.props, "content", "");
            const tag = readStringProp(node.props, "tag", "p");
            const safeTag = textTagSet.has(tag) ? tag : "p";
            const text = ctx.format === "html" ? escapeHtml(content) : escapeJsxText(content);
            const open = openTag(safeTag, {}, baseCss, ctx, false);
            return `${pad}${open}${text}</${safeTag}>`;
        },
        button: () => {
            const label = readStringProp(node.props, "label", "ボタン");
            const variant = readStringProp(node.props, "variant", "primary");
            const text = ctx.format === "html" ? escapeHtml(label) : escapeJsxText(label);
            const open = openTag("button", { type: "button", "data-variant": variant }, baseCss, ctx, false);
            return `${pad}${open}${text}</button>`;
        },
        image: () => {
            const src = readStringProp(node.props, "src", "");
            const alt = readStringProp(node.props, "alt", "");
            const objectFitRaw = readStringProp(node.props, "objectFit", "cover");
            const css = { ...baseCss, objectFit: toObjectFit(objectFitRaw) };

            if (!src) {
                const open = openTag("div", {}, css, ctx, false);
                const placeholder = "画像未設定";
                return `${pad}${open}${placeholder}</div>`;
            }

            return `${pad}${openTag("img", { src, alt }, css, ctx, true )}`;
        },
        input: () => {
            const placeholder = readStringProp(node.props, "placeholder", "");
            const inputType = readStringProp(node.props, "inputType", "text");
            return `${pad}${openTag("input", { type: inputType, placeholder }, baseCss, ctx, true)}`;
        },
        spacer: () => {
            const size = readNumberProp(node.props, "size", 16);
            const css = mergeCss(baseCss, {
                height: `${size}px`,
                width: "100%",
            });

            return `${pad}${openTag("div", { "aria-hidden": "true" }, css, ctx, true)}`;
        },
    };

    return emitters[node.type]();
};

export const generateCode = (
    document: PageDocument,
    options: CodegenOptions = {},
): string => {
    const format = options.format ?? "html";
    const indentSize = options.indentSize ?? 2;
    const includePageWrapper = options.includePageWrapper ?? true;

    const ctx: EmitContext = { format, indentSize };
    const body = emitNode(document.root, ctx, includePageWrapper ? 1 : 0);

    if (!includePageWrapper) {
        return body.trimEnd() + "\n";
    }

    const page = document.pageLayout;
    const pageCss: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: page.maxWidth,
        padding: spacingToPx(page.padding),
        justifyContent: justifyMap[page.justify] ?? "flex-start",
        alignContent: alignMap[page.align] ?? "flex-start",
        boxSizing: "border-box",
    };

    if (page.background) {
        pageCss.backgroundColor = page.background;
    }

    const open = openTag("div", {}, pageCss, ctx, false);
    return `${open}\n${body}\n</div>\n`;
};