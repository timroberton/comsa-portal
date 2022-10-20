import { useState } from "react";
import { deleteUser, newUser, updateUser } from "../actions/auth";
import { _LABEL_ADMINISTATOR, _LABEL_EDITOR, _LABEL_VIEWER } from "../consts";
import { NewUserRequest, User } from "../types";
import { Modal, ModalActions } from "./modals";
import { UIButton, UICheckbox, UIColor, UIInput, UIInputType } from "./ui";

type UserEditorProps = {
    initialUser: User,
    cancel: () => void,
    isNewUser: boolean,
    refreshUsers?: () => Promise<void>,
};

enum PrivilegeLevel {
    Admin,
    Editor,
    Viewer,
}

export const UserEditor: React.FC<UserEditorProps> = (p) => {

    const [tempName, setTempName] = useState<string>(p.initialUser.name);
    const [tempEmail, setTempEmail] = useState<string>(p.initialUser.email);
    const [tempPassword, setTempPassword] = useState<string>("");
    const [tempPrivilege, setTempPrivilege] = useState<PrivilegeLevel>(() => {
        if (p.initialUser.isAdmin) {
            return PrivilegeLevel.Admin;
        }
        if (p.initialUser.canEdit) {
            return PrivilegeLevel.Editor;
        }
        return PrivilegeLevel.Viewer;
    });

    const [saving, setSaving] = useState<boolean>(false);

    async function attemptSave() {
        if (tempName.trim() === "") {
            window.alert("You must enter a name");
            return;
        }
        if (tempEmail.trim() === "") {
            window.alert("You must enter an email");
            return;
        }
        if (p.isNewUser && tempPassword.trim() === "") {
            window.alert("You must enter a password");
            return;
        }
        setSaving(true);
        if (p.isNewUser) {
            const nur: NewUserRequest = {
                email: tempEmail.toLowerCase().trim(),
                name: tempName.trim(),
                password: tempPassword.trim(),
                isAdmin: tempPrivilege === PrivilegeLevel.Admin,
                canEdit: tempPrivilege !== PrivilegeLevel.Viewer,
            };
            const res = await newUser(nur);
            if (res !== "success") {
                window.alert("Problem saving user");
                setSaving(false);
                return;
            }
        } else {
            const u: User = {
                email: p.initialUser.email,
                name: tempName.trim(),
                isAdmin: tempPrivilege === PrivilegeLevel.Admin,
                canEdit: tempPrivilege !== PrivilegeLevel.Viewer,
            };
            const res = await updateUser(u);
            if (res !== "success") {
                window.alert("Problem saving user");
                setSaving(false);
                return;
            }
        }
        if (p.refreshUsers) {
            await p.refreshUsers();
        }
        p.cancel();
    }

    async function attemptDelete() {
        if (!window.confirm("Are you sure?")) {
            return;
        }
        setSaving(true);
        const res = await deleteUser({ email: p.initialUser.email });
        if (res !== "success") {
            window.alert("Problem deleting user");
            setSaving(false);
            return;
        }
        if (p.refreshUsers) {
            await p.refreshUsers();
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
                {!p.isNewUser &&
                    <div className="mb-3 text-xl font-bold">{p.initialUser.email}</div>
                }
                <div className="ui-form-subheader">Name</div>
                <UIInput
                    value={tempName}
                    onChange={setTempName}
                    autoFocus
                />
                {p.isNewUser && <>
                    <div className="mt-4 ui-form-subheader">Email</div>
                    <UIInput
                        type={UIInputType.email}
                        value={tempEmail}
                        onChange={setTempEmail}
                    />
                    <div className="mt-4 ui-form-subheader">New password</div>
                    <UIInput
                        type={UIInputType.password}
                        value={tempPassword}
                        onChange={setTempPassword}
                    />
                </>}
                <div className="py-1"></div>
                <UICheckbox
                    rootId="admin-privilege"
                    checked={tempPrivilege === PrivilegeLevel.Admin}
                    label={_LABEL_ADMINISTATOR}
                    onChange={() => setTempPrivilege(PrivilegeLevel.Admin)}
                    radio
                />
                <UICheckbox
                    rootId="edit-privilege"
                    checked={tempPrivilege === PrivilegeLevel.Editor}
                    label={_LABEL_EDITOR}
                    onChange={() => setTempPrivilege(PrivilegeLevel.Editor)}
                    radio
                />
                <UICheckbox
                    rootId="view-privilege"
                    checked={tempPrivilege === PrivilegeLevel.Viewer}
                    label={_LABEL_VIEWER}
                    onChange={() => setTempPrivilege(PrivilegeLevel.Viewer)}
                    radio
                />
                {p.isNewUser
                    ? <ModalActions>
                        <UIButton
                            label="Create new user"
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
                            label="Delete this user"
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
