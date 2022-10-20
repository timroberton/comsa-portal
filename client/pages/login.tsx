import Head from "next/head";
import { NextPage } from "next";
import { LoginState, UseUser } from "../hooks/use_user";
import {
  UIButton,
  UIButtonType,
  UIColor,
  UIInput,
  UIInputType,
} from "../components/ui";
import router from "next/router";
import { useEffect, useState } from "react";

const isDev = process.env.NODE_ENV === "development";

export const _DEFAULT_EMAIL = isDev ? "tim@gmail.com" : "";
export const _DEFAULT_PASSWORD = isDev ? "az" : "";

interface IndexProps {
  uu: UseUser;
}

const Index: NextPage<IndexProps> = (p) => {
  const [email, setEmail] = useState<string>(_DEFAULT_EMAIL);
  const [password, setPassword] = useState<string>(_DEFAULT_PASSWORD);
  const [openForgotPassword, setOpenForgotPassword] = useState<boolean>(false);

  async function submit(evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    evt.preventDefault();
    if (p.uu.loginState !== LoginState.LoggedOut) {
      return;
    }
    await p.uu.login(email.toLowerCase(), password);
  }

  useEffect(() => {
    if (p.uu.loginState === LoginState.LoggedIn) {
      router.push("/");
    }
  }, [p.uu.loginState]);

  return (
    <>
      <Head>
        <title>Analysis Portal</title>
        <link rel="stylesheet" type="text/css" href="/roboto.css" />
      </Head>

      <div className="flex items-start justify-center w-full h-full p-8 bg-blue-200">
        <form
          id="signInForm"
          className="px-8 py-6 mt-12 bg-white border border-gray-300 w-96"
        >
          <div className="text-xl font-semibold leading-none tracking-wide">
            Analysis Portal
          </div>
          <div className="mt-4 ui-form-subheader">Email</div>
          <UIInput
            type={UIInputType.email}
            value={email}
            onChange={setEmail}
            autoFocus
          />
          <div className="mt-4 ui-form-subheader">Password</div>
          <UIInput
            type={UIInputType.password}
            value={password}
            onChange={setPassword}
          />

          {p.uu.loginState === LoginState.LoggedOut ? (
            <>
              {p.uu.loginErr && (
                <div className="mt-4 text-sm text-red-500">{p.uu.loginErr}</div>
              )}
              <div className="flex justify-between mt-4">
                <UIButton
                  color={UIColor.Blue}
                  label="Login"
                  onClick={submit}
                  type={UIButtonType.Submit}
                  form="signInForm"
                />
                {!openForgotPassword && (
                  <span
                    className="text-sm ui-link"
                    onClick={() => setOpenForgotPassword(true)}
                  >
                    Forgot password
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="mt-4 text-sm text-green-500">Logging in...</div>
          )}

          {openForgotPassword && (
            <div className="px-3 py-2 mt-4 text-gray-700 bg-gray-100 border border-gray-700">
              If you don't remember your password, contact one of the Analysis
              Portal administrators. They will create a new password for you and
              tell you this new password. You can then login and change your
              password again to something that is only known by you.
              <div className="">
                <span
                  className="text-sm ui-link"
                  onClick={() => setOpenForgotPassword(false)}
                >
                  Close
                </span>
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default Index;
