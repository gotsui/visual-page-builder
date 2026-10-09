import {
    BuilderNode,
    createDefaultLayout,
    createDefaultPageLayout,
    createDefaultStyle,
    NodeType,
    PageDocument,
} from "./schema";

const createId = (): string => {
    return crypto.randomUUID();
};

export const createRootNode = (): BuilderNode => {
    return {
        id: createId(),
        type: "container",
        props: {},
        style: createDefaultStyle({
            width: "100%",
            minHeight: "100%",
        }),
        layout: createDefaultLayout(),
        children: [],
    };
};

export const createEmptyPageDocument = (
    name: string = "無題のページ"
): PageDocument => {
    return {
        id: createId(),
        name,
        root: createRootNode(),
        pageLayout: createDefaultPageLayout(),
        version: 1,
        updatedAt: new Date().toISOString(),
    };
};