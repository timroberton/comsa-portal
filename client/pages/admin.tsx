import Head from "next/head";
import { NextPage } from "next";
import { deleteDataFile, getAllUsers } from "../actions/crud";
import { FolderType, User } from "../types";
import { Frame1 } from "../components/frame_1";
import { _HOST } from "../urls";
import { useEffect, useState } from "react";
import { Uploader } from "../components/uploader";
import { LoginState, UseUser } from "../hooks/use_user";
import { UseDataFiles } from "../hooks/use_data_files";
import { PlusIcon, RefreshIcon, UploadIcon } from "@heroicons/react/outline";
import { UIColor } from "../components/ui";
import { UserEditor } from "../components/user_editor";
import { PasswordEditor } from "../components/password_editor";
import { _LABEL_ADMINISTATOR, _LABEL_EDITOR, _LABEL_VIEWER } from "../consts";
import { Scheduler } from "../components/scheduler";

interface IndexProps {
  uu: UseUser;
  ud: UseDataFiles;
}

const Index: NextPage<IndexProps> = (p) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [openModal, setOpenModal] = useState<User | undefined | "new">(
    undefined
  );
  const [openPasswordEditor, setOpenPasswordEditor] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);

  const isAdmin = p.uu.loginState === LoginState.LoggedIn && p.uu.user.isAdmin;

  useEffect(() => {
    refreshUsers();
  }, []);

  async function refreshUsers() {
    setLoading(true);
    const res = await getAllUsers();
    if (!res) {
      return;
    }
    res.sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1));
    setUsers(res);
    setLoading(false);
  }

  return (
    <>
      <Head>
        <title>Analysis Portal</title>
        <link rel="stylesheet" type="text/css" href="/roboto.css" />
      </Head>

      <Frame1
        uu={p.uu}
        page="admin"
        title="Admin"
        buttons={[
          {
            label: "Refresh admin",
            onClick: refreshUsers,
            icon: RefreshIcon,
            color: UIColor.LightGray,
          },
          {
            label: "New user",
            onClick: () => setOpenModal("new"),
            icon: PlusIcon,
          },
        ]}
      >
        {!isAdmin ? (
          <div className="">Not authorized</div>
        ) : loading ? (
          <div className="">Loading...</div>
        ) : (
          <>
            <ul className="px-6 py-2 overflow-hidden bg-white">
              <div className="mt-2 mb-1 text-base font-bold">Users</div>
              {users.length === 0 && (
                <div className="py-2 text-sm leading-5">No users</div>
              )}
              {users.map((a, i) => {
                return (
                  <li
                    key={a.email}
                    className={`${
                      i > 0 ? "border-t border-gray-200" : ""
                    } py-2 grid grid-cols-12 gap-4 text-sm leading-5 select-text`}
                  >
                    <div className="col-span-3 truncate">{a.name}</div>
                    <div className="col-span-3 truncate">{a.email}</div>
                    <div className="col-span-3 truncate">
                      {a.isAdmin
                        ? "Administrator"
                        : a.canEdit
                        ? "Editor"
                        : "Viewer"}
                    </div>
                    <div className="col-span-3 text-right truncate">
                      <span
                        className="ui-link-gray"
                        onClick={() => setOpenModal(a)}
                      >
                        Edit user
                      </span>
                      <span
                        className="ml-4 ui-link-gray"
                        onClick={() => setOpenPasswordEditor(a.email)}
                      >
                        Change password
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Scheduler />
          </>
        )}
        {openModal && (
          <UserEditor
            cancel={() => setOpenModal(undefined)}
            initialUser={
              openModal === "new"
                ? {
                    name: "",
                    email: "",
                    isAdmin: false,
                    canEdit: false,
                  }
                : openModal
            }
            isNewUser={openModal === "new"}
            refreshUsers={refreshUsers}
          />
        )}
        {openPasswordEditor && (
          <PasswordEditor
            email={openPasswordEditor}
            cancel={() => setOpenPasswordEditor("")}
            adminIsChangingPassword={true}
          />
        )}
      </Frame1>
    </>
  );
};

export default Index;
