import { useState } from "react";
import { resetPassword } from "../actions/auth";
import { Modal, ModalActions } from "./modals";
import { UIButton, UIColor, UIInput, UIInputType } from "./ui";

type PasswordEditorProps = {
    email: string,
    cancel: () => void,
    adminIsChangingPassword: boolean,
};

export const PasswordEditor: React.FC<PasswordEditorProps> = (p) => {

    const [password, setPassword] = useState<string>("");

    const [saving, setSaving] = useState<boolean>(false);

    async function attemptSave() {
        if (password.trim() === "") {
            window.alert("You must enter a new password");
            return;
        }
        setSaving(true);
        const res = await resetPassword(p.email, password);
        if (res !== "success") {
            window.alert("Could not reset password");
            setSaving(false);
            return;
        }
        p.cancel();
    }

    return <Modal
        cancel={p.cancel}
        minWidth={600}
    >
        {saving
            ? <div className="">Saving...</div>
            : <>
                <div className="mb-3 text-xl font-bold">{p.email}</div>
                <div className="ui-form-subheader">New password</div>
                <UIInput
                    type={UIInputType.password}
                    value={password}
                    onChange={setPassword}
                    autoFocus
                />
                {p.adminIsChangingPassword &&
                    <div className="mt-4 text-sm">After you have saved this new password, you should contact the user, give them the new password you created, and ask them to login with this new password and change their password again themselves.</div>
                }
                <ModalActions>
                    <UIButton
                        label="Save new password"
                        onClick={attemptSave}
                        color={UIColor.Blue}
                    />
                    <UIButton
                        label="Cancel"
                        onClick={p.cancel}
                        color={UIColor.Gray}
                        marginLeft
                    />
                </ModalActions>
            </>
        }
    </Modal>;
};
