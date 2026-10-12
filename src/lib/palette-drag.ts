import { NodeType } from "./schema";

export type PaletteDragData = {
    source: "palette";
    nodeType: NodeType;
};

export const isPaletteDragData = (data: unknown): data is PaletteDragData => {
    if (typeof data !== "object" || data === null) {
        return false;
    }

    if (!("source" in data) || !("nodeType" in data)) {
        return false;
    }

    const source = Reflect.get(data, "source");
    const nodeType = Reflect.get(data, "nodeType");
    return source === "palette" && typeof nodeType === "string";
};

export const containerDropId = (nodeId: string): string => {
    return `container-drop:${nodeId}`;
};

export const parseContainerDropId = (id: string): string | null => {
    const prefix = "container-drop:";

    if (!id.startsWith(prefix)) {
        return null;
    }

    return id.slice(prefix.length);
};