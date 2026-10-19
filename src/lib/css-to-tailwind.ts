import { CSSProperties } from "react";

const justifyContentClass: Record<string, string> = {
    "flex-start": "justify-start",
    center: "justify-center",
    "flex-end": "justify-end",
    "space-between": "justify-between",
    "space-around": "justify-around",
    "space-evenly": "justify-evenly",
};

const alignItemClass: Record<string, string> = {
    "flex-start": "items-start",
    center: "items-center",
    "flex-end": "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
};

const flexDirectionClass: Record<string, string> = {
    row: "flex-row",
    column: "flex-col",
    "row-reverse": "flex-row-reverse",
    "column-reverse": "flex-col-reverse",
};

const flexWrapClass: Record<string, string> = {
    wrap: "flex-wrap",
    nowrap: "flex-nowrap",
    "wrap-reverse": "flex-wrap-reverse",
};

const textAlignClass: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
    justify: "text-justify",
};

const objectFitClass: Record<string, string> = {
    contain: "object-contain",
    cover: "object-cover",
    fill: "object-fill",
    none: "object-none",
    "scale-down": "object-scale-down",
};

const boxSizingClass: Record<string, string> = {
    "border-box": "box-border",
    "content-box": "box-content",
};

const spacingToken = (pxValue: string): string | null => {
    const match = /^(-?\d+(?:\.\d+)?)px$/.exec(pxValue.trim());

    if (!match) {
        return null;
    }

    const px = Number(match[1]);

    if (!Number.isFinite(px)) {
        return null;
    }

    if (px % 4 !== 0) {
        return null;
    }

    const token = px / 4;

    if (token < 0 || token > 96) {
        return null;
    }

    return String(token);
};

const arbitrary = (value: string): string => {
    return value.trim().replaceAll(" ", "_");
};

const widthMap: Record<string, string> = {
    "100%": "w-full",
    "100vw": "w-screen",
    auto: "w-auto",
    "fit-content": "w-fit",
};

const widthClass = (value: string): string => {
    const mapped = widthMap[value];

    if (mapped) {
        return mapped;
    }

    const token = spacingToken(value);

    if (token !== null) {
        return `w-${token}`;
    }

    return `w-[${arbitrary(value)}]`;
};

const heightMap: Record<string, string> = {
    "100%": "h-full",
    "100vh": "h-screen",
    auto: "h-auto",
    "fit-content": "h-fit",
};

const heightClass = (value: string): string => {
    const mapped = heightMap[value];

    if (mapped) {
        return mapped;
    }

    const token = spacingToken(value);

    if (token !== null) {
        return `h-${token}`;
    }

    return `h-[${arbitrary(value)}]`;
};

const minWidthClass = (value: string): string => {
    if (value === "100%") {
        return "min-w-full";
    }

    const token = spacingToken(value);

    if (token !== null) {
        return `min-w-${token}`;
    }

    return `min-w-[${arbitrary(value)}]`;
};

const maxWidthClass = (value: string): string => {
    if (value === "100%") {
        return "max-w-full";
    }

    const token = spacingToken(value);

    if (token !== null) {
        return `max-w-${token}`;
    }

    return `max-w-[${arbitrary(value)}]`;
};

const minHeightClass = (value: string): string => {
    if (value === "100%") {
        return "min-h-full";
    }

    const token = spacingToken(value);

    if (token !== null) {
        return `min-h-${token}`;
    }

    return `min-h-[${arbitrary(value)}]`;
};

const paddingClass = (prefix: string, value: string): string => {
    const token = spacingToken(value);

    if (token !== null) {
        return `${prefix}-${token}`;
    }

    return `${prefix}-[${arbitrary(value)}]`;
};

const marginClass = (prefix: string, value: string): string => {
    if (value === "auto") {
        return `${prefix}-auto`;
    }

    const token = spacingToken(value);

    if (token !== null) {
        return `${prefix}-${token}`;
    }

    return `${prefix}-[${arbitrary(value)}]`;
};

const gapClass = (value: string): string => {
    const token = spacingToken(value);

    if (token !== null) {
        return `gap-${token}`;
    }

    return `gap-[${arbitrary(value)}]`;
};

const fontSizeMap: Record<string, string> = {
    "12px": "text-xs",
    "14px": "text-sm",
    "16px": "text-base",
    "18px": "text-lg",
    "20px": "text-xl",
    "24px": "text-2xl",
    "30px": "text-3xl",
    "36px": "text-4xl",
};

const fontSizeClass = (value: string): string => {
    return fontSizeMap[value] ?? `text-[${arbitrary(value)}]`;
};

const fontWeightMap: Record<string, string> = {
    "100": "font-thin",
    "200": "font-extralight",
    "300": "font-light",
    "400": "font-normal",
    "500": "font-medium",
    "600": "font-semibold",
    "700": "font-bold",
    "800": "font-extrabold",
    "900": "font-black",
    normal: "font-normal",
    bold: "font-bold",
};

const fontWeightClass = (value: string): string => {
    return fontWeightMap[value] ?? `font-[${arbitrary(value)}]`;
};

const colorClass = (prefix: string, value: string): string => {
    const named: Record<string, string> = {
        transparent: `${prefix}-transparent`,
        inherit: `${prefix}-inherit`,
        currentColor: `${prefix}-current`,
        white: `${prefix}-white`,
        black: `${prefix}-black`,
    };

    return named[value] ?? `${prefix}-[${arbitrary(value)}]`;
};

const borderRadiusMap: Record<string, string> = {
    "0px": "rounded-none",
    "2px": "rounded-sm",
    "4px": "rounded",
    "6px": "rounded-md",
    "8px": "rounded-lg",
    "12px": "rounded-xl",
    "16px": "rounded-2xl",
    "9999px": "rounded-full",
    "50%": "rounded-full",
};

const borderRadiusClass = (value: string): string => {
    return borderRadiusMap[value] ?? `rounded-[${arbitrary(value)}]`;
};

const borderWidthMap: Record<string, string> = {
    "0": "border-0",
    "0px": "border-0",
    "1px": "border",
    "2px": "border-2",
    "4px": "border-4",
    "8px": "border-8",
};

const borderWidthClass = (value: string): string => {
    return borderWidthMap[value] ?? `border-[${arbitrary(value)}]`;
};

const borderStyleMap: Record<string, string> = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
    none: "border-none",
};

const borderStyleClass = (value: string): string => {
    return borderStyleMap[value] ?? `border-[${arbitrary(value)}]`;
};

const displayMap: Record<string, string> = {
    flex: "flex",
    block: "block",
    inline: "inline",
    "inline-block": "inline-block",
    "inline-flex": "inline-flex",
    grid: "grid",
    none: "hidden",
};

const displayClass = (value: string): string => {
    return displayMap[value] ?? `[display:${arbitrary(value)}]`;
};

export const cssPropertiesToTailwind = (css: CSSProperties): string => {
    const classes: string[] = [];

    const push = (value: string | undefined) => {
        if (value && value.length > 0) {
            classes.push(value);
        }
    };

    css.display && push(displayClass(String(css.display)));
    css.flexDirection && push(flexDirectionClass[String(css.flexDirection)]);
    css.flexWrap && push(flexWrapClass[String(css.flexWrap)]);
    css.justifyContent && push(justifyContentClass[String(css.justifyContent)]);
    css.alignItems && push(alignItemClass[String(css.alignItems)]);
    css.gap && push(gapClass(String(css.gap)));
    css.width && push(widthClass(String(css.width)));
    css.height && push(heightClass(String(css.height)));
    css.minWidth && push(minWidthClass(String(css.minWidth)));
    css.maxWidth && push(maxWidthClass(String(css.maxWidth)));
    css.minHeight && push(minHeightClass(String(css.minHeight)));
    css.padding && push(paddingClass("p", String(css.padding)));
    css.paddingTop && push(paddingClass("pt", String(css.paddingTop)));
    css.paddingRight && push(paddingClass("pr", String(css.paddingRight)));
    css.paddingBottom && push(paddingClass("pb", String(css.paddingBottom)));
    css.paddingLeft && push(paddingClass("pl", String(css.paddingLeft)));
    css.margin && push(marginClass("m", String(css.margin)));
    css.marginTop && push(marginClass("mt", String(css.marginTop)));
    css.marginRight && push(marginClass("mr", String(css.marginRight)));
    css.marginBottom && push(marginClass("mb", String(css.marginBottom)));
    css.marginLeft && push(marginClass("ml", String(css.marginLeft)));
    css.backgroundColor && push(colorClass("bg", String(css.backgroundColor)));
    css.color && push(colorClass("text", String(css.backgroundColor)));
    css.fontSize && push(fontSizeClass(String(css.fontSize)));
    css.fontWeight && push(fontWeightClass(String(css.fontWeight)));
    css.textAlign && push(textAlignClass[String(css.textAlign)]);
    css.borderWidth && push(borderWidthClass(String(css.borderWidth)));
    css.borderStyle && push(borderStyleClass(String(css.borderStyle)));
    css.borderColor && push(colorClass("border", String(css.borderColor)));
    css.borderRadius && push(borderRadiusClass(String(css.borderRadius)));
    css.objectFit && push(objectFitClass[String(css.objectFit)]);
    css.boxSizing && push(boxSizingClass[String(css.boxSizing)]);

    return classes.filter(Boolean).join(" ");
};