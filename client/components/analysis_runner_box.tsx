import { BanIcon, LightningBoltIcon, XIcon } from "@heroicons/react/outline";
import { Spinner, UIButton, UIColor } from "./ui";
import { UseAnalysis } from "../hooks/use_analysis";
import { AnalysisStatus, Stage, StageResult, Status } from "../types";

type AnalysisRunnerBoxProps = {
    uap: UseAnalysis,
    analysisStatus: AnalysisStatus,
    analyze: () => void,
    stop: () => void,
};

export const AnalysisRunnerBox: React.FC<AnalysisRunnerBoxProps> = (p) => {
    return <div className="flex">
        <div className="flex-1 ui-pad">
            {p.analysisStatus.analyzing
                ? <div className="flex items-center">
                    <Spinner size={8} />
                    <UIButton
                        label="Stop"
                        onClick={p.stop}
                        color={UIColor.Red}
                        icon={XIcon}
                        marginLeft
                    />
                </div>
                : (p.uap.needsSaving
                    ? <UIButton
                        label="Save before running"
                        icon={BanIcon}
                        disabled
                    />
                    : <UIButton
                        label="Run analysis"
                        onClick={p.analyze}
                        color={UIColor.Green}
                        icon={LightningBoltIcon}
                    />
                )
            }
            <div className="mt-2">
                Status: {statusLabel(p.analysisStatus.finalStatus)}
            </div>
        </div>
        <div className="flex-none text-sm ui-pad">
            <div className="flex">
                <div className="flex-1 text-right">Initialized analysis</div>
                <div className="flex-none ml-2">{iconForStageResult(p.analysisStatus[Stage.InitializeAnalysis])}</div>
            </div>
            <div className="flex">
                <div className="flex-1 text-right">Found all input files</div>
                <div className="flex-none ml-2">{iconForStageResult(p.analysisStatus[Stage.ImportInputFiles])}</div>
            </div>
            <div className="flex">
                <div className="flex-1 text-right">Finished script</div>
                <div className="flex-none ml-2">{iconForStageResult(p.analysisStatus[Stage.CleanRun])}</div>
            </div>
            <div className="flex">
                <div className="flex-1 text-right">Created all output files</div>
                <div className="flex-none ml-2">{iconForStageResult(p.analysisStatus[Stage.OutputFiles])}</div>
            </div>
        </div>
    </div>;
};

function iconForStageResult(sr: StageResult): JSX.Element {
    switch (sr) {
        case StageResult.Pending:
            return <svg className="flex-shrink-0 w-5 h-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" />
            </svg>;
        case StageResult.Success:
            return <svg className="flex-shrink-0 w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>;
        case StageResult.Failure:
            return <svg className="flex-shrink-0 w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>;
    }
    return <svg className="flex-shrink-0 w-5 h-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" />
    </svg>;
}

function statusLabel(status: Status): string {
    switch (status) {
        case Status.NotRun:
            return "Not Run";
        case Status.Success:
            return "Success";
        case Status.Failed:
            return "Failed";
        case Status.Running:
            return "Running";
        case Status.StoppedByUser:
            return "Stopped by user";
        default:
            return "Unknown";
    }
}