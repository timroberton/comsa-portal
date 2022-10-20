import router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { deleteAnalysis, getAnalysis, updateAnalysis } from "../actions/crud";
import { AnalysisPackage, LanguageType, FolderType, InputFile, OutputFile, StageResult } from "../types";
import { copy } from "../utils";

export type UseAnalysis = {
    data: AnalysisPackageData,
    //
    tempName: string,
    tempLanguage: LanguageType,
    tempCode: string,
    tempTopic: string,
    tempTags: string[],
    tempScheduled: boolean,
    tempInputs: InputFile[],
    tempOutputs: OutputFile[],
    //
    updateTempName: (v: string) => void,
    updateTempLanguage: (v: LanguageType) => void,
    updateTempCode: (v: string) => void,
    updateTempTopic: (v: string) => void,
    updateTempTags: (v: string[]) => void,
    updateTempScheduled: (v: boolean) => void,
    //
    updateTempInputFolder: (analysisId: string, i: number) => void,
    updateTempInputFile: (fileName: string, i: number) => void,
    addTempInputFile: () => void,
    removeTempInputFile: (i: number) => void,
    //
    updateTempOutputName: (fileName: string, i: number) => void,
    updateTempOutputPublic: (isPublic: boolean, i: number) => void,
    addTempOutputFile: () => void,
    removeTempOutputFile: (i: number) => void,
    //
    needsSaving: boolean,
    save: () => Promise<void>,
    revert: () => void,
    attemptDeleteAnalysis: () => Promise<void>,
}

type AnalysisPackageData = AnalysisPackageLoading | AnalysisPackageError | AnalysisPackageReady;

type AnalysisPackageLoading = {
    loading: true,
    ready: false,
};

type AnalysisPackageError = {
    loading: false,
    ready: false,
    err: string,
};

type AnalysisPackageReady = {
    loading: false,
    ready: true,
    analysisPackage: AnalysisPackage,
};

export function useAnalysis(refreshAnalyses: () => Promise<void>): UseAnalysis {

    const ur = useRouter();

    useEffect(() => {
        if (!ur.isReady) {
            return;
        }
        if (!ur.query.id) {
            router.push('/');
            return;
        }
        if (!ur.query.id) {
            router.push('/');
            return;
        }
        if (ur.query.id instanceof Array) {
            router.push('/');
            return;
        }
        firstLoad(ur.query.id);
    }, [ur.isReady, ur.query.id]);

    const [apd, setAPD] = useState<AnalysisPackageData>({ loading: true, ready: false });

    const [tempName, setTempName] = useState<string>("Loading...");
    const [tempLanguage, setTempLanguage] = useState<LanguageType>(LanguageType.R);
    const [tempCode, setTempCode] = useState<string>("");
    const [tempTags, setTempTags] = useState<string[]>([]);
    const [tempTopic, setTempTopic] = useState<string>("");
    const [tempScheduled, setTempScheduled] = useState<boolean>(false);
    const [tempInputs, setTempInputs] = useState<InputFile[]>([]);
    const [tempOutputs, setTempOutputs] = useState<OutputFile[]>([]);

    const [needsSaving, setNeedsSaving] = useState<boolean>(false);

    function updateTempName(v: string) {
        setNeedsSaving(true);
        setTempName(v);
    }

    function updateTempLanguage(v: LanguageType) {
        setNeedsSaving(true);
        setTempLanguage(v);
    }

    function updateTempTopic(v: string) {
        setNeedsSaving(true);
        setTempTopic(v);
    }

    function updateTempScheduled(v: boolean) {
        setNeedsSaving(true);
        setTempScheduled(v);
    }

    function updateTempTags(v: string[]) {
        setNeedsSaving(true);
        setTempTags(v);
    }

    function updateTempCode(v: string) {
        setNeedsSaving(true);
        setTempCode(v);
    }

    function updateTempInputFolder(analysisId: string, i: number) {
        setNeedsSaving(true);
        setTempInputs(prev => {
            const n = copy(prev);
            n[i].folderType = analysisId === "data" ? FolderType.DATA : FolderType.ANALYSIS;
            n[i].analysisId = analysisId;
            n[i].fileName = "UNSELECTED";
            return n;
        });
    }

    function updateTempInputFile(fileName: string, i: number) {
        setNeedsSaving(true);
        setTempInputs(prev => {
            const n = copy(prev);
            n[i].fileName = fileName;
            return n;
        });
    }

    function addTempInputFile() {
        setNeedsSaving(true);
        setTempInputs(prev => {
            const n = copy(prev);
            n.push({ analysisId: "data", folderType: FolderType.DATA, fileName: "UNSELECTED" });
            return n;
        });
    }

    function removeTempInputFile(i: number) {
        if (!window.confirm("Are you sure?")) {
            return;
        }
        setNeedsSaving(true);
        setTempInputs(prev => {
            const n = copy(prev);
            n.splice(i, 1);
            return n;
        });
    }

    function updateTempOutputName(fileName: string, i: number) {
        setNeedsSaving(true);
        setTempOutputs(prev => {
            const n = copy(prev);
            n[i].fileName = fileName;
            return n;
        });
    }

    function updateTempOutputPublic(isPublic: boolean, i: number) {
        setNeedsSaving(true);
        setTempOutputs(prev => {
            const n = copy(prev);
            n[i].public = isPublic;
            return n;
        });
    }

    function addTempOutputFile() {
        setNeedsSaving(true);
        setTempOutputs(prev => {
            const n = copy(prev);
            n.push({ fileName: "", public: false });
            return n;
        });
    }

    function removeTempOutputFile(i: number) {
        if (!window.confirm("Are you sure?")) {
            return;
        }
        setNeedsSaving(true);
        setTempOutputs(prev => {
            const n = copy(prev);
            n.splice(i, 1);
            return n;
        });
    }

    function storeNewAnalysisPackage(newAnalysisPackage: AnalysisPackage | undefined): void {
        if (!newAnalysisPackage) {
            setAPD({ loading: false, ready: false, err: "Could not reach server" });
            return;
        }
        setAPD({
            loading: false,
            ready: true,
            analysisPackage: newAnalysisPackage,
        });
        setTemps(newAnalysisPackage);
    }

    async function firstLoad(id: string): Promise<void> {
        const newAnalysisPackage = await getAnalysis(id);
        storeNewAnalysisPackage(newAnalysisPackage);
    }

    function setTemps(ap: AnalysisPackage): void {
        setTempName(ap.metadata.name);
        setTempLanguage(ap.metadata.language);
        setTempTags(ap.metadata.tags);
        setTempTopic(ap.metadata.topic);
        setTempScheduled(ap.metadata.scheduled);
        setTempCode(ap.code);
        setTempInputs(ap.metadata.inputs);
        setTempOutputs(ap.metadata.outputs);
        setNeedsSaving(false);
    }

    async function save() {
        if (!apd.ready) {
            return;
        }
        setAPD({ loading: true, ready: false });
        const apToSave: AnalysisPackage = {
            id: apd.analysisPackage.id,
            code: tempCode,
            metadata: {
                name: tempName,
                language: tempLanguage,
                inputs: tempInputs,
                outputs: tempOutputs,
                topic: tempTopic,
                tags: tempTags,
                createdAt: apd.analysisPackage.metadata.createdAt,
                createdBy: apd.analysisPackage.metadata.createdBy,
                lastRunAt: apd.analysisPackage.metadata.lastRunAt,
                lastRunBy: apd.analysisPackage.metadata.lastRunBy,
                lastModifiedAt: apd.analysisPackage.metadata.lastModifiedAt,
                lastModifiedBy: apd.analysisPackage.metadata.lastModifiedBy,
                scheduled: tempScheduled,
                lastStatus: apd.analysisPackage.metadata.lastStatus,
            },
        };
        const newAnalysisPackage = await updateAnalysis(apToSave);
        if (!newAnalysisPackage) {
            alert("Could not save");
            return;
        }
        await refreshAnalyses();
        storeNewAnalysisPackage(newAnalysisPackage);
    }

    function revert() {
        if (!window.confirm("Are you sure?")) {
            return;
        }
        if (!apd.ready) {
            return;
        }
        setTemps(apd.analysisPackage);
    }

    async function attemptDeleteAnalysis() {
        if (!apd.ready) {
            return;
        }
        if (!window.confirm("Are you sure?")) {
            return;
        }
        setAPD({ loading: true, ready: false });
        const newAnalyses = await deleteAnalysis(apd.analysisPackage.id);
        if (!newAnalyses) {
            alert("Could not delete");
            return;
        }
        await refreshAnalyses();
        ur.push("/");
    }

    return {
        data: apd,
        //
        tempName,
        tempLanguage,
        tempCode,
        tempTopic,
        tempTags,
        tempInputs,
        tempScheduled,
        tempOutputs,
        //
        updateTempName,
        updateTempLanguage,
        updateTempCode,
        updateTempTopic,
        updateTempTags,
        updateTempScheduled,
        //
        updateTempInputFolder,
        updateTempInputFile,
        addTempInputFile,
        removeTempInputFile,
        //
        updateTempOutputName,
        updateTempOutputPublic,
        addTempOutputFile,
        removeTempOutputFile,
        //
        needsSaving,
        save,
        revert,
        attemptDeleteAnalysis,
    };

}