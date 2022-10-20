import { useState } from "react";
import { updateTopics } from "../actions/crud";
import { Topic } from "../types";
import { Modal, ModalActions } from "./modals";
import { UIButton, UIColor, UIInput } from "./ui";
import { customAlphabet } from "nanoid";

export const getNewId = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 16);

type TopicEditorProps = {
    topics: Topic[],
    id?: string,
    initialLabel: string,
    cancel: () => void,
    isNewTopic: boolean,
    refreshTopics: () => Promise<void>,
};

export const TopicEditor: React.FC<TopicEditorProps> = (p) => {

    const [tempLabel, setTempLabel] = useState<string>(p.initialLabel);

    const [saving, setSaving] = useState<boolean>(false);

    async function attemptCreateNew() {
        if (!tempLabel.trim()) {
            window.alert("You must enter a label");
            return;
        }
        setSaving(true);
        const newTopic = {
            id: getNewId(),
            label: tempLabel.trim(),
        };
        const newTopics = [
            ...p.topics,
            newTopic,
        ];
        const res = await updateTopics(newTopics);
        if (res !== "success") {
            window.alert("Something went wrong. Could not update");
            setSaving(false);
            return;
        }
        await p.refreshTopics();
        p.cancel();
    }

    async function attemptSave() {
        if (!tempLabel.trim()) {
            window.alert("You must enter a label");
            return;
        }
        setSaving(true);
        const newTopics = [...p.topics];
        const toChange = newTopics.find(a => a.id === p.id);
        if (toChange) {
            toChange.label = tempLabel.trim();
        }
        const res = await updateTopics(newTopics);
        if (res !== "success") {
            window.alert("Something went wrong. Could not update");
            setSaving(false);
            return;
        }
        await p.refreshTopics();
        p.cancel();
    }

    async function attemptDelete() {
        if (!window.confirm("Are you sure?")) {
            return;
        }
        setSaving(true);
        const newTopics = [...p.topics];
        const index = newTopics.findIndex(a => a.id === p.id);
        newTopics.splice(index, 1);
        const res = await updateTopics(newTopics);
        if (res !== "success") {
            window.alert("Something went wrong. Could not update");
            setSaving(false);
            return;
        }
        await p.refreshTopics();
        p.cancel();
    }

    return <Modal
        cancel={p.cancel}
        minWidth={600}
    >
        {saving
            ? <div className="">Saving...</div>
            : <>
                <div className="ui-form-subheader">Topic label</div>
                <UIInput
                    value={tempLabel}
                    onChange={setTempLabel}
                    autoFocus
                />
                {p.isNewTopic
                    ? <ModalActions>
                        <UIButton
                            label="Create new topic"
                            onClick={attemptCreateNew}
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
                            label="Save"
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
                            label="Delete this topic"
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
