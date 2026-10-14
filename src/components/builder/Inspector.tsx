"use client";

import { BuilderNode, LayoutConfig, NodeType } from "@/lib/schema";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { useDocumentStore, useSelectedNode } from "@/lib/document-store";
import { findNode } from "@/lib/tree-operations";
import { getComponentDefinition } from "@/lib/component-registry";
import { textTags } from "@/lib/node-view-model";

type FieldProps = {
    label: string;
    children: ReactNode;
};

const Field = ({
    label,
    children,
}: FieldProps) => {
    return (
        <label className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
                {label}
            </span>
            {children}
        </label>
    );
};

const inputClassName = "w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none \
focus:border-blue-400 focus:ring-1 focus:ring-blue-400";

const readString = (
    props: Record<string, unknown>,
    key: string,
    fallback: string,
): string => {
    const value = props[key];
    return typeof value === "string" ? value : fallback;
};

const readNumber = (
    props: Record<string, unknown>,
    key: string,
    fallback: number,
): number => {
    const value = props[key];
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

type PropsEditorProps = {
    node: BuilderNode;
    onCommitProps: (props: Record<string, unknown>) => void;
};

const useLocalProps = (
    node: BuilderNode,
    onCommitProps: (props: Record<string, unknown>) => void,
) => {
    const [local, setLocal] = useState<Record<string, unknown>>(node.props);

    useEffect(() => {
        setLocal(node.props);
    }, [node.id, node.props]);

    const setField = useCallback((key: string, value: unknown) => {
        setLocal((prev) => ({ ...prev, [key]: value }));
    }, []);

    const commit = useCallback(() => {
        onCommitProps(local);
    }, [local, onCommitProps]);

    const onBlurCommit = useCallback(() => {
        commit();
    }, [commit]);

    return { local, setField, onBlurCommit, commit };
};

const TextPropsEditor = ({
    node,
    onCommitProps,
}: PropsEditorProps) => {
    const { local, setField, onBlurCommit } = useLocalProps(node, onCommitProps);

    return (
        <>
            <Field label="内容">
                <textarea
                    className={`${inputClassName} min-h-20 resize-y`}
                    value={readString(local, "content", "")}
                    onChange={(e) => setField("content", e.target.value)}
                    onBlur={onBlurCommit}
                />
            </Field>
            <Field label="タグ">
                <select
                    className={inputClassName}
                    value={readString(local, "tag", "p")}
                    onChange={(e) => setField("tag", e.target.value)}
                    onBlur={onBlurCommit}
                >
                    {textTags.map((tag) =>(
                        <option key={tag} value={tag}>{tag}</option>
                    ))}
                </select>
            </Field>
        </>
    );
};

const ButtonPropsEditor = ({
    node,
    onCommitProps,
}: PropsEditorProps) => {
    const { local, setField, onBlurCommit } = useLocalProps(node, onCommitProps);

    return (
        <>
            <Field label="ラベル">
                <input
                    type="text"
                    className={inputClassName}
                    value={readString(local, "label", "")}
                    onChange={(e) => setField("label", e.target.value)}
                    onBlur={onBlurCommit}
                />
            </Field>
            <Field label="バリアント">
                <select
                    className={inputClassName}
                    value={readString(local, "variant", "primary")}
                    onChange={(e) => setField("variant", e.target.value)}
                    onBlur={onBlurCommit}
                >
                    <option value="primary">primary</option>
                    <option value="secondary">secondary</option>
                    <option value="outline">outline</option>
                </select>
            </Field>
        </>
    );
};

const ImagePropsEditor = ({
    node,
    onCommitProps,
}: PropsEditorProps) => {
    const { local, setField, onBlurCommit } = useLocalProps(node, onCommitProps);

    return (
        <>
            <Field label="画像 URL">
                <input
                    type="url"
                    className={inputClassName}
                    value={readString(local, "src", "")}
                    onChange={(e) => setField("src", e.target.value)}
                    onBlur={onBlurCommit}
                />
            </Field>
            <Field label="代替テキスト">
                <input
                    type="text"
                    className={inputClassName}
                    value={readString(local, "alt", "")}
                    onChange={(e) => setField("alt", e.target.value)}
                    onBlur={onBlurCommit}
                />
            </Field>
            <Field label="object-fit">
                <select
                    className={inputClassName}
                    value={readString(local, "objectFit", "cover")}
                    onChange={(e) => setField("objectFit", e.target.value)}
                    onBlur={onBlurCommit}
                >
                    <option value="cover">cover</option>
                    <option value="contain">contain</option>
                    <option value="fill">fill</option>
                    <option value="none">none</option>
                    <option value="scale-down">scale-down</option>
                </select>
            </Field>
        </>
    );
};

const InputPropsEditor = ({
    node,
    onCommitProps,
}: PropsEditorProps) => {
    const { local, setField, onBlurCommit } = useLocalProps(node, onCommitProps);

    return (
        <>
            <Field label="プレースホルダー">
                <input
                    type="text"
                    className={inputClassName}
                    value={readString(local, "placeholder", "")}
                    onChange={(e) => setField("placeholder", e.target.value)}
                    onBlur={onBlurCommit}
                />
            </Field>
            <Field label="入力タイプ">
                <select
                    className={inputClassName}
                    value={readString(local, "inputType", "text")}
                    onChange={(e) => setField("inputType", e.target.value)}
                    onBlur={onBlurCommit}
                >
                    <option value="text">text</option>
                    <option value="email">email</option>
                    <option value="password">password</option>
                    <option value="number">number</option>
                    <option value="tel">tel</option>
                    <option value="url">url</option>
                    <option value="search">search</option>
                </select>
            </Field>
        </>
    );
};

const SpacerPropsEditor = ({
    node,
    onCommitProps,
}: PropsEditorProps) => {
    const { local, setField, onBlurCommit } = useLocalProps(node, onCommitProps);

    return (
        <Field label="サイズ (px)">
            <input
                type="number"
                min={0}
                className={inputClassName}
                value={readNumber(local, "size", 16)}
                onChange={(e) => setField("size", Number(e.target.value))}
                onBlur={onBlurCommit}
            />
        </Field>
    );
};

const ContainerPropsEditor = ({}: PropsEditorProps) => {
    return (
        <p className="mb-3 text-xs text-slate-400">
            グループに固有の内容プロパティはありません。下のレイアウトを編集してください。
        </p>
    );
};

const propsEditorMap: Record<NodeType, (props: PropsEditorProps) => ReactNode> = {
    container: (props) => <ContainerPropsEditor {...props} />,
    text: (props) => <TextPropsEditor {...props} />,
    button: (props) => <ButtonPropsEditor {...props} />,
    image: (props) => <ImagePropsEditor {...props} />,
    input: (props) => <InputPropsEditor {...props} />,
    spacer: (props) => <SpacerPropsEditor {...props} />,
};

type LayoutEditorProps = {
    layout: LayoutConfig;
    onCommitLayout: (layout: LayoutConfig) => void;
};

const LayoutEditor = ({ layout, onCommitLayout }: LayoutEditorProps) => {
    const [local, setLocal] = useState<LayoutConfig>(layout);

    useEffect(() => {
        setLocal(layout);
    }, [layout]);

    const commit = useCallback(() => {
        onCommitLayout(local);
    }, [local, onCommitLayout]);

    const onBlurCommit = useCallback(() => {
        commit();
    }, [commit]);

    return (
        <section className="mb-4 border-t border-slate-200 pt-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                レイアウト
            </h3>
            <Field label="方向">
                <select
                    className={inputClassName}
                    value={local.direction}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === "row" || value === "column") {
                            setLocal((prev) => ({ ...prev, direction: value }));
                        }
                    }}
                    onBlur={onBlurCommit}
                >
                    <option value="column">縦 (column)</option>
                    <option value="row">横 (row)</option>
                </select>
            </Field>
            <Field label="主軸の寄せ">
                <select
                    className={inputClassName}
                    value={local.justify}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (
                            value === "start" ||
                            value === "center" ||
                            value === "end" ||
                            value === "between" ||
                            value === "around"
                        ) {
                            setLocal((prev) => ({ ...prev, justify: value }));
                        }
                    }}
                    onBlur={onBlurCommit}
                >
                    <option value="start">start</option>
                    <option value="center">center</option>
                    <option value="end">end</option>
                    <option value="between">between</option>
                    <option value="around">around</option>
                </select>
            </Field>
            <Field label="交差軸の寄せ">
                <select
                    className={inputClassName}
                    value={local.align}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (
                            value === "start" ||
                            value === "center" ||
                            value === "end" ||
                            value === "stretch"
                        ) {
                            setLocal((prev) => ({ ...prev, align: value }));
                        }
                    }}
                    onBlur={onBlurCommit}
                >
                    <option value="start">start</option>
                    <option value="center">center</option>
                    <option value="end">end</option>
                    <option value="stretch">stretch</option>
                </select>
            </Field>
            <Field label="ギャップ">
                <input
                    type="number"
                    min={0}
                    className={inputClassName}
                    value={local.gap}
                    onChange={(e) => setLocal((prev) => ({ ...prev, gap: Number(e.target.value) }))}
                    onBlur={onBlurCommit}
                />
            </Field>
            <Field label="折り返し">
                <select
                    className={inputClassName}
                    value={local.wrap ? "true" : "false"}
                    onChange={(e) => setLocal((prev) => ({ ...prev, wrap: e.target.value === "true" }))}
                    onBlur={onBlurCommit}
                >
                    <option value="false">しない</option>
                    <option value="true">する</option>
                </select>
            </Field>
        </section>
    );
};

const Inspector = () => {
    const { state, dispatch, removeSelectedNode } = useDocumentStore();
    const selectedNode = useSelectedNode();
    const rootId = state.document.root.id;

    const commitProps = useCallback((nodeId: string, props: Record<string, unknown>) => {
        dispatch({ type: "REPLACE_NODE_PROPS", nodeId, props });
    }, [dispatch]);

    const commitLayout = useCallback((nodeId: string, layout: LayoutConfig) => {
        dispatch({ type: "UPDATE_NODE", nodeId, patch: { layout }});
    }, [dispatch]);

    if (!selectedNode) {
        return (
            <aside className="flex h-full w-72 shrink-0 flex-col border-l border-slate-200 bg-slate-50">
                <div className="border-b border-slate-200 px-3 py-2">
                    <h2 className="text-sm font-semibold text-slate-700">インスペクタ</h2>
                </div>
                <div className="p-4 text-sm text-slate-500">
                    要素を選択してください
                </div>
            </aside>
        );
    }

    const liveNode = findNode(state.document.root, selectedNode.id) ?? selectedNode;
    const definition = getComponentDefinition(liveNode.type);
    const isRoot = liveNode.id === rootId;
    const renderPropsEditor = propsEditorMap[liveNode.type];

    const defaultLayout: LayoutConfig = {
        direction: "column",
        justify: "start",
        align: "start",
        gap: 4,
        wrap: false,
    };

    return (
        <aside className="flex h-full w-72 shrink-0 flex-col border-l border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 px-3 py-2">
                <h2 className="text-sm font-semibold text-slate-700">インスペクタ</h2>
                <p className="mt-0.5 text-xs text-slate-500">{definition.label}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
                <section className="mb-2">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        内容
                    </h3>
                    {renderPropsEditor({ node: liveNode, onCommitProps: (props) => commitProps(liveNode.id, props) })}
                </section>
                {liveNode.type === "container" ? (
                    <LayoutEditor
                        layout={liveNode.layout ?? defaultLayout}
                        onCommitLayout={(layout) => commitLayout(liveNode.id, layout)}
                    />
                ) : null}
                {!isRoot ? (
                    <div className="mt-4 border-t border-slate-200 pt-3">
                        <button
                            type="button"
                            className="w-full rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red100"
                            onClick={removeSelectedNode}
                        >
                            削除
                        </button>
                    </div>
                ) : (
                    <p className="mt-4 text-xs text-slate-400">ルートは削除できません</p>
                )}
            </div>
        </aside>
    );
};

export default Inspector;