import { CSSProperties } from "react";
import { cssObjectToInline, NodeViewModel, pageLayoutToCssObject, readStringProp, sanitizeCss, toNodeViewModel } from "./node-view-model";
import { BuilderNode, PageDocument } from "./schema";
import { cssPropertiesToTailwind } from "./css-to-tailwind";

export const codegenFormats = ["html", "jsx", "tailwind"] as const;
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
    view: NodeViewModel,
    ctx: EmitContext,
    selfClosing: boolean,
): string => {
    const attrParts: string[] = [];

    for (const [key, value] of Object.entries(view.attrs)) {
        if (ctx.format === "html") {
            attrParts.push(`${key}="${escapeHtml(value)}"`);
        } else {
            const jsxKey = key === "class" ? "className" : key;
            attrParts.push(`${jsxKey}=${JSON.stringify(value)}`);
        }
    }

    const cleanCss = sanitizeCss(view.css);

    if (ctx.format === "tailwind") {
        const className = cssPropertiesToTailwind(cleanCss);

        if (className.length > 0) {
            attrParts.push(`className=${JSON.stringify(className)}`);
        }
    } else {
        const hasCss = Object.keys(cleanCss).length > 0;

        if (hasCss) {
            if (ctx.format === "html") {
                attrParts.push(`style="${escapeHtml(cssObjectToInline(cleanCss))}"`);
            } else {
                attrParts.push(`style=${cssObjectToJsx(cleanCss)}`);
            }
        }
    }

    const attrStr = attrParts.length > 0 ? ` ${attrParts.join(" ")}` : "";

    if (selfClosing) {
        return`<${view.tag}${attrStr} />`;
    }

    return `<${view.tag}${attrStr}>`;
};

const emitLabeledControl = (
    node: BuilderNode,
    ctx: EmitContext,
    depth: number,
): string => {
    const pad = " ".repeat(ctx.indentSize * depth);
    const innerPad = " ".repeat(ctx.indentSize * (depth + 1));
    const view = toNodeViewModel(node, "base");
    const label = readStringProp(node.props, "label", "");

    const controlCss = label.length > 0 ? {} : view.css;
    const controlView: NodeViewModel = {
        ...view,
        css: controlCss,
    };

    const controlOpen = openTag(controlView, ctx, view.selfClosing);
    const control =
        view.selfClosing
        ? `${controlOpen}`
        : `${controlOpen}</${view.tag}>`;

    if (label.length === 0) {
        return `${pad}${control}`;
    }

    const labelCss = view.css;
    const labelView: NodeViewModel = {
        type: node.type,
        tag: "label",
        attrs: {},
        css: labelCss,
        selfClosing: false,
        children: [],
    };

    const labelText = ctx.format === "html" ? escapeHtml(label) : escapeJsxText(label);

    const open = openTag(labelView, ctx, false);

    const inputLine = `${innerPad}${openTag(
        { ...view, css: {}, selfClosing: true },
        ctx,
        true
    )}`;
    return `${pad}${open}\n${innerPad}<span>${labelText}</span>\n${inputLine}\n${pad}</label>`;
}

const emitNode = (
    node: BuilderNode,
    ctx: EmitContext,
    depth: number,
): string => {
    if (node.type === "input") {
        return emitLabeledControl(node, ctx, depth);
    }

    const pad = " ".repeat(ctx.indentSize * depth);
    const view = toNodeViewModel(node, "lg");

    if (view.selfClosing) {
        return `${pad}${openTag(view, ctx, true)}`;
    }

    const text = view.text === undefined
        ? ""
        : ctx.format === "html"
            ? escapeHtml(view.text)
            : escapeJsxText(view.text);

    if (view.children.length === 0) {
        return `${pad}${openTag(view, ctx, false)}${text}</${view.tag}>`;
    }

    const inner = view.children
        .map((child) => emitNode(child, ctx, depth + 1))
        .join("\n");

    return `${pad}${openTag(view, ctx, false)}\n${inner}\n${pad}</${view.tag}>`;
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

    const pageCss = sanitizeCss(pageLayoutToCssObject(document.pageLayout));
    const wrapperView: NodeViewModel = {
        type: "container",
        tag: "div",
        attrs: {},
        css: pageCss,
        selfClosing: false,
        children: [],
    };

    const open = openTag(wrapperView, ctx, false);
    return `${open}\n${body}\n</div>\n`;
};