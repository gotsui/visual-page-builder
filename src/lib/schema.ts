import { z } from "zod";

export const JustifySchema = z.enum([
    "start",
    "center",
    "end",
    "between",
    "around",
]);
export type Justify = z.infer<typeof JustifySchema>;

export const AlignSchema = z.enum(["start", "center", "end", "stretch"]);
export type Align = z.infer<typeof AlignSchema>;

export const BreakpointSchema = z.enum(["lg", "md", "sm", "base"]);
export type Breakpoint = z.infer<typeof BreakpointSchema>;

export const LayoutConfigSchema = z.object({
    direction: z.enum(["row", "column"]).default("column"),
    justify: JustifySchema.default("start"),
    align: AlignSchema.default("start"),
    gap: z.number().min(0).default(4),
    wrap: z.boolean().default(false),
});
export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;

export const StyleValueSchema = z.object({
    width: z.string().optional(),
    height: z.string().optional(),
    minWidth: z.string().optional(),
    maxWidth: z.string().optional(),
    minHeight: z.string().optional(),
    maxHeight: z.string().optional(),
    margin: z.string().optional(),
    marginTop: z.string().optional(),
    marginRight: z.string().optional(),
    marginBottom: z.string().optional(),
    marginLeft: z.string().optional(),
    padding: z.string().optional(),
    paddingTop: z.string().optional(),
    paddingRight: z.string().optional(),
    paddingBottom: z.string().optional(),
    paddingLeft: z.string().optional(),
    backgroundColor: z.string().optional(),
    color: z.string().optional(),
    fontSize: z.string().optional(),
    fontWeight: z.string().optional(),
    textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    borderWidth: z.string().optional(),
    borderStyle: z.string().optional(),
    borderColor: z.string().optional(),
    borderRadius: z.string().optional(),
}).strict();
export type StyleValue = z.infer<typeof StyleValueSchema>;

export const ResponsiveStyleSchema = z.object({
    lg: StyleValueSchema.optional(),
    md: StyleValueSchema.optional(),
    sm: StyleValueSchema.optional(),
    base: StyleValueSchema.default({}),
});
export type ResponsiveStyle = z.infer<typeof ResponsiveStyleSchema>;

export const ContainerPropsSchema = z.object({
    role: z.string().optional(),
});

export const TextPropsSchema = z.object({
    content: z.string().default("テキスト"),
    tag: z.enum(["p", "h1", "h2", "h3", "h4", "span"]).default("p"),
});

export const ButtonPropsSchema = z.object({
    label: z.string().default("ボタン"),
    variant: z.enum(["primary", "secondary", "outline"]).default("primary"),
});

export const ImagePropsSchema = z.object({
    src: z.string().default(""),
    alt: z.string().default(""),
    objectFit: z.enum(["contain", "cover", "fill", "none", "scale-down"]).default("cover"),
});

export const InputPropsSchema = z.object({
    label: z.string().default(""),
    placeholder: z.string().default(""),
    inputType: z.enum(["text", "email", "password", "number", "tel", "url", "search"]).default("text"),
});

export const SpacerPropsSchema = z.object({
    size: z.number().min(0).default(16),
});

export const NodeTypeSchema = z.enum([
    "container",
    "text",
    "button",
    "image",
    "input",
    "spacer",
]);
export type NodeType = z.infer<typeof NodeTypeSchema>;

export type BuilderNode = {
    id: string;
    type: NodeType;
    props: Record<string, unknown>;
    style: ResponsiveStyle;
    layout?: LayoutConfig;
    children: BuilderNode[];
};

export const BuilderNodeSchema: z.ZodType<BuilderNode> = z.lazy(() => z.object({
    id: z.string().uuid(),
    type: NodeTypeSchema,
    props: z.record(z.string(), z.unknown()),
    style: ResponsiveStyleSchema,
    layout: LayoutConfigSchema.optional(),
    children: z.array(BuilderNodeSchema),
}));

export const validateNodeProps = (
    type: NodeType,
    props: unknown,
):
    | { success: true; data: Record<string, unknown> }
    | { success: false, error: z.ZodError } => {
    const schemaMap = {
        container: ContainerPropsSchema,
        text: TextPropsSchema,
        button: ButtonPropsSchema,
        image: ImagePropsSchema,
        input: InputPropsSchema,
        spacer: SpacerPropsSchema,
    } as const;

    const schema = schemaMap[type];
    const result = schema.safeParse(props);

    if (result.success) {
        return { success: true, data: result.data };
    } else {
        return { success: false, error: result.error };
    }
};

export const PageLayoutSchema = z.object({
    maxWidth: z.string().default("100%"),
    padding: z.number().min(0).default(4),
    justify: z.enum(["start", "center", "end"]).default("start"),
    align: z.enum(["start", "center", "end", "stretch"]).default("start"),
    background: z.string().optional(),
});
export type PageLayout = z.infer<typeof PageLayoutSchema>;

export const PageDocumentSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).default("無題のページ"),
    root: BuilderNodeSchema,
    pageLayout: PageLayoutSchema,
    version: z.number().int().positive().default(1),
    updatedAt: z.string().datetime(),
});
export type PageDocument = z.infer<typeof PageDocumentSchema>;

export const PreviewModeSchema = z.enum(["edit", "preview"]);
export type PreveiwMode = z.infer<typeof PreviewModeSchema>;

export const UiStateSchema = z.object({
    selectedNodeId: z.string().uuid().nullable().default(null),
    hoveredNodeId: z.string().uuid().nullable().default(null),
    previewMode: PreviewModeSchema.default("edit"),
    previewBreakpoint: BreakpointSchema.default("lg"),
    isDragging: z.boolean().default(false),
});
export type UiState = z.infer<typeof UiStateSchema>;

export const createDefaultLayout = (): LayoutConfig => {
    return LayoutConfigSchema.parse({});
};

export const createDefaultStyle = (
    overrides?: Partial<StyleValue>,
): ResponsiveStyle => {
    return ResponsiveStyleSchema.parse({
        base: overrides ?? {},
    });
};

export const createDefaultPageLayout = (): PageLayout => {
    return PageLayoutSchema.parse({});
};