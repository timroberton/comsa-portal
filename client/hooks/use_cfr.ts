import { useEffect, useState } from "react";
import { checkFile } from "../actions/crud";
import { CheckFileResponse, FolderType } from "../types";

export function useCFR(type: FolderType, analysisId: string, file: string, ignore: boolean): CheckFileResponse | undefined {

    const [cfr, setCFR] = useState<CheckFileResponse | undefined>(undefined);

    async function attemptCheckFile(folderType: FolderType, analysisId: string, fileName: string) {
        setCFR(undefined);
        const newCFR = await checkFile(folderType, analysisId, fileName);
        if (!newCFR) {
            console.error("Could not check file");
            setCFR({ exists: false, date: "", size: 0, public: false })
            return;
        }
        setCFR(newCFR);
    }

    useEffect(() => {
        if (ignore) {
            return;
        }
        attemptCheckFile(type, analysisId, file || "noname");
    }, [type, analysisId, file, ignore]);

    return cfr;

}