import { PlusIcon, TrashIcon } from "@heroicons/react/outline";
import { UIIconButton, UISelect } from "./ui";
import { UseAnalyses } from "../hooks/use_analyses";
import { UseAnalysis } from "../hooks/use_analysis";
import { UseDataFiles } from "../hooks/use_data_files";
import { AnalysisSummary, DataFile, FolderType } from "../types";
import { FileStatus } from "./file_status";

type AnalysisInputsProps = {
    analysisId: string,
    uap: UseAnalysis,
    ud: UseDataFiles,
    ua: UseAnalyses,
    canEdit: boolean,
};

export const AnalysisInputs: React.FC<AnalysisInputsProps> = (p) => {
    return <div className="w-full h-full overflow-y-auto ui-pad">
        {p.uap.tempInputs.map((a, i) => {
            const fileOptions = getFileOptions(a.folderType, a.analysisId, p.ud.dataFiles, p.ua.analyses);
            return <div
                key={i}
                className="mb-6"
            >
                <div className="flex mb-1">
                    <div className="flex-1">
                        <UISelect
                            value={a.analysisId}
                            onChange={val => p.uap.updateTempInputFolder(String(val), i)}
                            options={[
                                { value: "data", text: "Data" },
                                ...p.ua.analyses.filter(a => a.id !== p.analysisId).map(a => {
                                    return { value: a.id, text: a.metadata.name };
                                }),
                            ]}
                            disabled={!p.canEdit}
                        />
                    </div>
                    <div className="flex-1 ml-3">
                        <UISelect
                            value={a.fileName}
                            onChange={val => p.uap.updateTempInputFile(String(val), i)}
                            options={[
                                { value: "UNSELECTED", text: "Unselected" },
                                ...fileOptions,
                            ]}
                            disabled={!p.canEdit}
                        />
                    </div>
                    {p.canEdit &&
                        <span className="flex-none ml-3">
                            <UIIconButton
                                icon={TrashIcon}
                                onClick={() => p.uap.removeTempInputFile(i)}
                            />
                        </span>
                    }
                </div>
                <FileStatus
                    folderType={a.folderType}
                    analysisId={a.analysisId}
                    fileName={a.fileName}
                    needsSaving={false}
                />
            </div >;
        })}
        {p.canEdit &&
            <UIIconButton
                icon={PlusIcon}
                onClick={p.uap.addTempInputFile}
            />
        }
        <div className="py-2"></div>
    </div >;
};

function getFileOptions(folderType: FolderType, analysisId: string, dataFiles: DataFile[], analyses: AnalysisSummary[]): { value: string, text: string }[] {
    if (folderType === FolderType.DATA) {
        return dataFiles.map(a => {
            return { value: a.fileName, text: a.fileName };
        });
    }
    const analysis = analyses.find(a => a.id === analysisId);
    if (!analysis) {
        return [];
    }
    return analysis.metadata.outputs.map(a => {
        return { value: a.fileName, text: a.fileName };
    });
}
