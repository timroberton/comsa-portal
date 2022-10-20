import { UIButton, UIColor } from "./ui";
import Link from "next/link";
import { LoginState, UseUser } from "../hooks/use_user";
import { UserBoundary } from "./user_boundary";
import { PlusIcon } from "@heroicons/react/outline";
import { SVGProps, useState } from "react";
import { UserEditor } from "./user_editor";
import { PasswordEditor } from "./password_editor";

type Frame1Props = {
  uu: UseUser;
  page: string;
  title: string;
  buttons: {
    label: string;
    onClick?: () => void;
    icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
    color?: UIColor;
  }[];
};

export const Frame1: React.FC<Frame1Props> = ({
  children,
  page,
  title,
  buttons,
  uu,
}) => {
  const [openModal, setOpenModal] = useState<boolean>(false);

  return (
    <UserBoundary uu={uu}>
      <div className="flex flex-col w-full h-full bg-gray-200 select-none">
        <nav className="flex-none w-full overflow-y-scroll bg-gray-800 hide-functional-scrollbar">
          <div className="flex items-center justify-between h-16 px-4 xl:px-8 mx-auto max-w-[1500px]">
            <div className="flex-shrink-0 text-xl font-semibold leading-none tracking-wide text-white">
              Analysis Portal
            </div>
            <div className="flex items-baseline ml-10">
              <Link href="/">
                <a
                  className={`px-3 py-2 cursor-pointer text-sm font-medium ${
                    page == "analyses"
                      ? "text-white bg-gray-900"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  } focus:outline-none `}
                >
                  Analyses
                </a>
              </Link>
              <Link href="/data">
                <a
                  className={`ml-4 px-3 py-2 cursor-pointer text-sm font-medium ${
                    page == "data"
                      ? "text-white bg-gray-900"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  } focus:outline-none `}
                >
                  Data
                </a>
              </Link>
              {uu.loginState === LoginState.LoggedIn && uu.user.isAdmin && (
                <Link href="/admin">
                  <a
                    className={`ml-4 px-3 py-2 cursor-pointer text-sm font-medium ${
                      page == "admin"
                        ? "text-white bg-gray-900"
                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                    } focus:outline-none `}
                  >
                    Admin
                  </a>
                </Link>
              )}
            </div>
            <div className="flex-1"></div>
            {uu.loginState === LoginState.LoggedIn && (
              <div
                className={`flex group px-3 py-2 -mr-3 cursor-pointer text-sm font-medium text-blue-300 justify-end`}
              >
                {uu.user.name}
                <div className="absolute z-10 hidden -mr-3 text-right bg-gray-900 shadow-lg mt-7 w-36 group-hover:block">
                  <div
                    className="px-4 py-2.5 text-sm font-medium text-white cursor-pointer hover:bg-gray-700 focus:outline-none"
                    onClick={() => setOpenModal(true)}
                  >
                    Change password
                  </div>
                  <div
                    className="px-4 py-2.5 text-sm font-medium text-white cursor-pointer hover:bg-gray-700 focus:outline-none"
                    onClick={uu.logout}
                  >
                    Logout
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>
        <header className="flex-none w-full overflow-y-scroll bg-white border-b border-gray-200 hide-functional-scrollbar">
          <div className="flex items-center justify-between px-4 xl:px-8 py-4 mx-auto max-w-[1500px]">
            <h2 className="flex-1 min-w-0 text-2xl font-semibold leading-6 text-gray-900 sm:text-2xl sm:leading-10 sm:truncate">
              {title}
            </h2>
            {buttons.length > 0 && (
              <div className="flex mt-0 ml-4">
                {buttons.map((b) => {
                  return (
                    <UIButton
                      key={b.label}
                      label={b.label}
                      onClick={b.onClick || undefined}
                      color={b.color || UIColor.Blue}
                      marginLeft
                      icon={b.icon}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 w-full h-0 overflow-y-scroll">
          <div className="px-4 xl:px-8 py-6 mx-auto max-w-[1500px]">
            {children}
          </div>
        </main>
      </div>
      {uu.loginState === LoginState.LoggedIn && openModal && (
        <PasswordEditor
          cancel={() => setOpenModal(false)}
          email={uu.user.email}
          adminIsChangingPassword={false}
        />
      )}
    </UserBoundary>
  );
};
