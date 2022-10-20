import { XIcon } from "@heroicons/react/outline";
import { UseUI } from "../hooks/use_ui";
import { TagItem } from "./filter_controls_analyses";
import { UIColor, UIIconButton, UIInput } from "./ui";

type FilterControlsDataProps = {
    uui: UseUI,
    nTotal: number,
    nFiltered: number,
};

export const FilterControlsData: React.FC<FilterControlsDataProps> = (p) => {

    return <div className="px-4 py-4 text-sm">
        {p.nFiltered === p.nTotal
            ? <div className="">Showing all {p.nTotal} data files</div>
            : <div className="font-bold text-purple-600">Showing {p.nFiltered} of {p.nTotal} data files</div>
        }
        <div className="mt-4 font-bold">Search</div>
        <div className="flex items-center mt-1">
            <div className="flex-1">
                <UIInput
                    value={p.uui.searchTextData}
                    onChange={v => p.uui.updateSearchTextData(v)}
                    purple
                />
            </div>
            {p.uui.searchTextData !== "" &&
                <span className="flex-none ml-2">
                    <UIIconButton
                        icon={XIcon}
                        onClick={p.uui.clearSearchTextData}
                        color={UIColor.Purple}
                    />
                </span>
            }
        </div>
        <div className="mt-4 font-bold">File types</div>
        <TagItem
            label={"ODK (pulled daily)"}
            onClick={() => p.uui.toggleFileType("odk")}
            checked={p.uui.selectedFileType === "odk"}
        />
        <TagItem
            label={"Static"}
            onClick={() => p.uui.toggleFileType("static")}
            checked={p.uui.selectedFileType === "static"}
        />
    </div>;
};