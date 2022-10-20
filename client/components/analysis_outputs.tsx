import { PlusIcon, TrashIcon } from "@heroicons/react/outline";
import { UIButton, UIColor, UIIconButton, UIInput } from "./ui";
import { UseAnalysis } from "../hooks/use_analysis";
import { FolderType } from "../types";
import { FileStatus } from "./file_status";

type AnalysisOutputsProps = {
    uap: UseAnalysis,
    isAnalyzing: boolean,
    canEdit: boolean,
};

export const AnalysisOutputs: React.FC<AnalysisOutputsProps> = (p) => {

    return <div className="w-full h-full overflow-y-auto ui-pad">
        {p.isAnalyzing
            ? <div className="">Currently analyzing...</div>
            : <>
                {p.uap.tempOutputs.map((a, i) => {
                    if (!p.uap.data.ready) {
                        return null;
                    }
                    return <div
                        key={i}
                        className="mb-6"
                    >
                        <div className="flex mb-1">
                            <div className="flex-1">
                                <UIInput
                                    value={a.fileName}
                                    onChange={v => p.uap.updateTempOutputName(v, i)}
                                    disabled={!p.canEdit}
                                />
                            </div>
                            {p.canEdit && <>
                                <span className="flex-none ml-3">
                                    <UIButton
                                        label={"Private"}
                                        onClick={() => p.uap.updateTempOutputPublic(false, i)}
                                        color={a.public ? UIColor.LightGray : UIColor.Gray}
                                        disabled={!a.public}
                                    />
                                    <UIButton
                                        label={"Public"}
                                        onClick={() => p.uap.updateTempOutputPublic(true, i)}
                                        color={a.public ? UIColor.Gray : UIColor.LightGray}
                                        disabled={a.public}
                                    />
                                </span>
                                <span className="flex-none ml-3">
                                    <UIIconButton
                                        icon={TrashIcon}
                                        onClick={() => p.uap.removeTempOutputFile(i)}
                                    />
                                </span>
                            </>}
                        </div>
                        <FileStatus
                            folderType={FolderType.ANALYSIS}
                            analysisId={p.uap.data.analysisPackage.id}
                            fileName={a.fileName}
                            needsSaving={p.uap.needsSaving}
                        />
                    </div>;
                })}
                {p.canEdit &&
                    <UIIconButton
                        icon={PlusIcon}
                        onClick={p.uap.addTempOutputFile}
                    />
                }
                <div className="py-2"></div>
            </>
        }
    </div>;
};
