import BuilderShell from "@/components/builder/BuilderShell"
import { DocumentProvider } from "@/lib/document-store"

const BuilderPage = () => {
    return (
        <DocumentProvider>
            <BuilderShell />
        </DocumentProvider>
    );
};

export default BuilderPage;