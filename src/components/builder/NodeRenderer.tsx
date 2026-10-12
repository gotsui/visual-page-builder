"use client";

import { useDocumentStore } from "@/lib/document-store";
import { Align, Breakpoint, BuilderNode, Justify, LayoutConfig, NodeType, ResponsiveStyle, StyleValue } from "@/lib/schema";
import { horizontalListSortingStrategy, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSSProperties, MouseEvent, ReactNode } from "react";
import SortableNode from "./SortableNode";
import DroppableContainer from "./DroppableContainer";

const justifyMap: Record<Justify, CSSProperties["justifyContent"]> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    between: "space-between",
    around: "space-around",
};

const alignMap: Record<Align, CSSProperties["alignItems"]> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
};

const spacingToPx = (value: number): string => {
    return `${value * 4}px`;
};

const layoutToCss = (layout: LayoutConfig | undefined): CSSProperties => {
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

const resolveStyle = (style: ResponsiveStyle, breakpoint: Breakpoint): StyleValue => {
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

const styleValueToCss = (value: StyleValue): CSSProperties => {
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

const readStringProp = (
  props: Record<string, unknown>,
  key: string,
  fallback: string,
): string => {
  const value = props[key];
  return typeof value === "string" ? value : fallback;
};

const readNumberProp = (
  props: Record<string, unknown>,
  key: string,
  fallback: number,
): number => {
  const value = props[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

export const textTags = ["p", "h1", "h2", "h3", "h4", "span"] as const;
type TextTag = typeof textTags[number];
const textTagSet: ReadonlySet<string> = new Set(textTags);

const isTextTag = (value: string): value is TextTag => {
    return textTagSet.has(value);
};

const readTextTag = (props: Record<string, unknown>): TextTag => {
    const value = readStringProp(props, "tag", "p");
    return isTextTag(value) ? value : "p";
};

const objectFitSet: ReadonlySet<string> = new Set([
    "contain",
    "cover",
    "fill",
    "none",
    "scale-down",
]);

type ObjectFit = NonNullable<CSSProperties["objectFit"]>;

const isObjectFit = (value: string): value is ObjectFit => {
    return objectFitSet.has(value);
};

const readObjectFit = (props: Record<string, unknown>): ObjectFit => {
    const value = readStringProp(props, "objectFit", "cover");
    return isObjectFit(value) ? value : "cover";
};

const buttonVariantClassMap: Record<string, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300",
    outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
};

const readButtonVariantClass = (props: Record<string, unknown>): string => {
    const variant = readStringProp(props, "variant", "primary");
    return buttonVariantClassMap[variant] ?? buttonVariantClassMap.primary;
};

type BodyProps = {
    node: BuilderNode;
    style: CSSProperties;
    children?: ReactNode;
};

const ContainerBody = ({ node, style, children }: BodyProps) => {
    const { state } = useDocumentStore();
    const isEdit = state.ui.previewMode === "edit";
    const editStyle: CSSProperties = isEdit
        ? {
            ...style,
            minHeight: style.minHeight ?? "40px",
            minWidth: style.minWidth ?? "48px",
            paddingTop: style.padding ?? "8px",
            paddingRight: style.padding ?? "8px",
            paddingBottom: style.padding ?? "8px",
            paddingLeft: style.padding ?? "8px",
        }
        : style;

    return (
        <DroppableContainer
            nodeId={node.id}
            style={editStyle}
            disabled={!isEdit}
        >
            {children}
        </DroppableContainer>
    );
};

const textTagRenderMap: Record<TextTag, (style: CSSProperties, content: string) => ReactNode > = {
    p: (style, content) => <p style={style}>{content}</p>,
    h1: (style, content) => <h1 className="text-4xl font-extrabold tracking-tight" style={style}>{content}</h1>,
    h2: (style, content) => <h2 className="text-3xl font-bold tracking-tight" style={style}>{content}</h2>,
    h3: (style, content) => <h3 className="text-2xl font-bold" style={style}>{content}</h3>,
    h4: (style, content) => <h4 className="text-xl font-semibold" style={style}>{content}</h4>,
    span: (style, content) => <span style={style}>{content}</span>,
};

const TextBody = ({ node, style }: BodyProps) => {
    const content = readStringProp(node.props, "content", "");
    const tag = readTextTag(node.props);
    return textTagRenderMap[tag](style, content);
};

const ButtonBody = ({ node, style }: BodyProps) => {
    const label = readStringProp(node.props, "label", "ボタン");
    const variantClass = readButtonVariantClass(node.props);

    return (
        <button
            type="button"
            style={style}
            className={`rounded px-3 py-1.5 text-sm ${variantClass}`}
            onClick={(e) => e.preventDefault()}
        >
            {label}
        </button>
    );
};

const ImageBody = ({ node, style }: BodyProps) => {
    const src = readStringProp(node.props, "src", "");
    const alt = readStringProp(node.props, "alt", "");
    const objectFit = readObjectFit(node.props);

    if (!src) {
        return (
            <div
                style={style}
                className="flex h-24 w-40 items-center justify-center bg-slate-100 text-xs text-slate-400"
            >
                画像未設定
            </div>
        );
    }

    return (
        <img src={src} alt={alt} style={{ ...style, objectFit }} />
    );
};

const InputBody = ({ node, style }: BodyProps) => {
    const placeholder = readStringProp(node.props, "placeholder", "");
    const inputType = readStringProp(node.props, "inputType", "text");

    return (
        <input
            type={inputType}
            placeholder={placeholder}
            style={style}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            readOnly
            onMouseDown={(e) => e.preventDefault()}
        />
    );
};

const SpacerBody = ({ node }: BodyProps) => {
    const size = readNumberProp(node.props, "size", 16);

    return (
        <div style={{ height: size, width: "100%", minWidth: 48 }} />
    );
};

const nodeBodyMap: Record<NodeType, (props: BodyProps) => ReactNode> = {
    container: ContainerBody,
    text: TextBody,
    button: ButtonBody,
    image: ImageBody,
    input: InputBody,
    spacer: SpacerBody,
};

type ContainerChildrenProps = {
    node: BuilderNode;
    isEdit: boolean;
};

const ContainerChildren = ({
    node,
    isEdit,
}: ContainerChildrenProps) => {
    const childIds = node.children.map((child) => child.id);
    const isRow = node.layout?.direction === "row";
    const strategy = isRow ? horizontalListSortingStrategy : verticalListSortingStrategy;

    if (!isEdit) {
        return (
            <>
                {node.children.map((child) => (
                    <NodeRenderer key={child.id} node={child} />
                ))}
            </>
        );
    }

    if (node.children.length === 0) {
        return (
            <div className="pointer-events-none select-none py-6 text-center text-xs text-slate-300">
                ここにドロップ
            </div>
        );
    }

    return (
        <SortableContext items={childIds} strategy={strategy}>
            {node.children.map((child) => (
                <SortableNode key={child.id} id={child.id}>
                    <NodeRenderer node={child} />
                </SortableNode>
            ))}
        </SortableContext>
    );
};

type NodeRendererProps = {
    node: BuilderNode;
    isRoot?: boolean;
};

const NodeRenderer = ({
    node,
    isRoot = false,
}: NodeRendererProps) => {
    const { state, selectNode, dispatch } = useDocumentStore();
    const { selectedNodeId, hoveredNodeId, previewMode, previewBreakpoint } = state.ui;

    const isEdit = previewMode === "edit";
    const isSelected = isEdit && selectedNodeId === node.id;
    const isHoverd = isEdit && hoveredNodeId === node.id && !isSelected;

    const resolved = resolveStyle(node.style, previewBreakpoint);
    const baseCss = styleValueToCss(resolved);
    const layoutCss = node.type === "container" ? layoutToCss(node.layout) : undefined;

    const margedStyle: CSSProperties = {
        ...baseCss,
        ...layoutCss,
    };

    const handleClick = (e: MouseEvent) => {
        if (!isEdit) {
            return;
        }

        e.stopPropagation();
        selectNode(node.id);
    };

    const handleMouseEnter = (e: MouseEvent) => {
        if (!isEdit) {
            return;
        }

        e.stopPropagation();
        dispatch({ type: "SET_HOVERED_NODE", nodeId: node.id });
    };

    const handleMouseLeave = (e: MouseEvent) => {
        if (!isEdit) {
            return;
        }

        e.stopPropagation();
        dispatch({ type: "SET_HOVERED_NODE", nodeId: null });
    };

    const outlineClass = isSelected
        ? "outline outline-2 outline-blue-500 outline-offset-1"
        : isHoverd
            ? "outline outline-1 outline-blue-300 outline-offset-1"
            : "outline outline-1 outline-dashed outline-slate-200 outline-offset-0";

    const Body = nodeBodyMap[node.type];
    const childNodes = node.type === "container"
        ? <ContainerChildren node={node} isEdit={isEdit} />
        : null;

    if (!isEdit) {
        return (
            <Body node={node} style={margedStyle} children={childNodes} />
        );
    }

    return (
        <div
            data-node-id={node.id}
            data-root={isRoot ? "true" : undefined}
            className={`relative ${outlineClass}`}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Body node={node} style={margedStyle} children={childNodes} />
        </div>
    );
};

export default NodeRenderer;