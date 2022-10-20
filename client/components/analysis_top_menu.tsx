import { UseAnalysis } from "../hooks/use_analysis";
import router from "next/router";
import { ArrowLeftIcon } from "@heroicons/react/outline";
import { LanguageType } from "../types";

type AnalysisTopMenuProps = {
    uap: UseAnalysis,
    openSettings: () => void,
    canEdit: boolean,
};

export const AnalysisTopMenu: React.FC<AnalysisTopMenuProps> = (p) => {

    function goBack() {
        if (p.uap.needsSaving && !window.confirm("You have unsaved changes which will be lost if you continue. Are you sure you want to continue?")) {
            return;
        }
        router.push('/');
    }

    return <header className="flex items-center w-full h-10 text-white bg-gray-800 select-none font-book">

        <button
            className="flex-none h-full px-4 py-2 w-14 ui-btn-blue"
            onClick={goBack}
        >
            <ArrowLeftIcon />
        </button>

        <h2 className="flex-1 px-4 text-base font-semibold leading-none tracking-wide truncate">{p.uap.tempName}</h2>

        {!p.uap.data.loading && <>

            <span className="flex-none px-4 text-sm leading-none text-blue-300 border-none">{p.uap.tempLanguage === LanguageType.R ? "R" : "Stata"}</span>

            {p.canEdit && <>
                <button
                    className={`flex-none h-full px-4 border-none text-sm leading-none ${p.uap.needsSaving ? "ui-btn-green" : "bg-gray-800 text-gray-500 pointer-events-none"} `}
                    onClick={p.uap.save}
                    disabled={!p.uap.needsSaving}
                >Save</button>
                <button
                    className={`flex-none h-full px-4 border-none text-sm leading-none ${p.uap.needsSaving ? "ui-btn-orange" : "bg-gray-800 text-gray-500 pointer-events-none"}`}
                    onClick={p.uap.revert}
                    disabled={!p.uap.needsSaving}
                >Revert</button>
                <button
                    className={`flex-none h-full px-4 border-none text-sm leading-none ui-btn-gray`}
                    onClick={p.openSettings}
                >Settings</button>
            </>}

        </>}

    </header>;
};
