import { useState } from "react";
import { UseAnalysis } from "../hooks/use_analysis";
import { LanguageType, Topic } from "../types";
import { Modal, ModalActions } from "./modals";
import { UIButton, UICheckbox, UIColor, UIInput, UISelect } from "./ui";

type SettingsEditorProps = {
    initialName: string,
    initialLanguage: LanguageType,
    initialTopic: string,
    initialTags: string[],
    initialScheduled: boolean,
    save: (newName: string, newLanguage: LanguageType, newTopic: string, newTags: string[], newScheduled: boolean) => Promise<void>
    cancel: () => void,
    topics: Topic[],
    isNewAnalysis: boolean,
    attemptDeleteAnalysis?: () => Promise<void>,
};

export const SettingsEditor: React.FC<SettingsEditorProps> = (p) => {

    const [tempName, setTempName] = useState<string>(p.initialName);
    const [tempLanguage, setTempLanguage] = useState<LanguageType>(p.initialLanguage);
    const [tempTopic, setTempTopic] = useState<string>(p.initialTopic);
    const [tempTagsAsString, setTempTagsAsString] = useState<string>(p.initialTags.join(", "));
    const [tempScheduled, setTempScheduled] = useState<boolean>(p.initialScheduled);

    const [saving, setSaving] = useState<boolean>(false);

    async function attemptSave() {
        if (tempName.trim() === "") {
            window.alert("You must enter a name for the analysis");
            return;
        }
        setSaving(true);
        const tags = tempTagsAsString.trim().split(",").map(a => a.trim()).filter(a => a);
        await p.save(
            tempName.trim(),
            tempLanguage,
            tempTopic.trim(),
            tags,
            tempScheduled,
        );
        p.cancel();
    }

    async function attemptDelete() {
        if (!p.attemptDeleteAnalysis) {
            return;
        }
        setSaving(true);
        await p.attemptDeleteAnalysis();
        p.cancel();
    }

    return <Modal
        cancel={p.cancel}
        minWidth={600}
    >
        {saving
            ? <div className="">Saving...</div>
            : <>
                <div className="ui-form-subheader">Title</div>
                <UIInput
                    value={tempName}
                    onChange={setTempName}
                    autoFocus
                />
                <div className="mt-4 ui-form-subheader">Statistical package</div>
                <UISelect
                    value={tempLanguage}
                    onChange={v => setTempLanguage(v as LanguageType)}
                    options={[
                        { value: LanguageType.Stata, text: "Stata" },
                        { value: LanguageType.R, text: "R" },
                    ]}
                />
                <div className="mt-4 ui-form-subheader">Topic</div>
                <UISelect
                    value={tempTopic}
                    onChange={v => setTempTopic(String(v))}
                    options={[
                        { value: "", text: "No topic" },
                        ...p.topics.map(a => {
                            return { value: a.id, text: a.label };
                        }),
                    ]}
                />
                {/* <UIInput
                    value={tempTopic}
                    onChange={setTempTopic}
                /> */}
                <div className="mt-4 ui-form-subheader">Tags (comma separated)</div>
                <UIInput
                    value={tempTagsAsString}
                    onChange={setTempTagsAsString}
                />
                <div className="mt-4 ui-form-subheader">Scheduler</div>
                <UICheckbox
                    rootId="schedule"
                    label="Include this analysis in daily scheduled run"
                    checked={tempScheduled}
                    onChange={checked => setTempScheduled(checked)}
                />

                {p.isNewAnalysis
                    ? <ModalActions>
                        <UIButton
                            label="Create new analysis"
                            onClick={attemptSave}
                            color={UIColor.Green}
                        />
                        <UIButton
                            label="Cancel"
                            onClick={p.cancel}
                            color={UIColor.Gray}
                            marginLeft
                        />
                    </ModalActions>
                    : <ModalActions>
                        <UIButton
                            label="Done"
                            onClick={attemptSave}
                            color={UIColor.Blue}
                        />
                        <UIButton
                            label="Cancel"
                            onClick={p.cancel}
                            color={UIColor.Gray}
                            marginLeft
                        />
                        <div className="flex-1"></div>
                        <UIButton
                            label="Delete this analysis"
                            onClick={attemptDelete}
                            color={UIColor.Red}
                            marginLeft
                        />
                    </ModalActions>
                }
            </>

        }
    </Modal>;
};
