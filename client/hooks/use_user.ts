import { useEffect, useState } from "react";
import { attemptGetUser, attemptLogin, attemptLogout } from "../actions/auth";
import { User } from "../types";

export type UseUser = UseUserLoggingIn | UseUserLoggingOut | UseUserLoggedIn | UseUserLoggedOut;

export enum LoginState {
    LoggingIn,
    LoggingOut,
    LoggedIn,
    LoggedOut,
}

type UseUserLoggingIn = {
    loginState: LoginState.LoggingIn,
}

type UseUserLoggingOut = {
    loginState: LoginState.LoggingOut,
}

type UseUserLoggedIn = {
    loginState: LoginState.LoggedIn,
    user: User,
    logout: () => Promise<void>,
}

type UseUserLoggedOut = {
    loginState: LoginState.LoggedOut,
    login: (email: string, password: string) => Promise<void>,
    loginErr: string,
}

export function useUser(): UseUser {

    const [uu, setUU] = useState<UseUser>({ loginState: LoginState.LoggingIn });

    useEffect(() => {
        refreshUser();
    }, []);

    async function refreshUser(): Promise<void> {
        setUU({ loginState: LoginState.LoggingIn });
        const user = await attemptGetUser();
        if (!user) {
            logout();
            return;
        }
        setUU({
            loginState: LoginState.LoggedIn,
            user,
            logout,
        });
    }

    async function login(email: string, password: string): Promise<void> {
        setUU({ loginState: LoginState.LoggingIn });
        const loginReturn = await attemptLogin(email, password);
        if (!loginReturn) {
            setUU({
                loginState: LoginState.LoggedOut,
                login,
                loginErr: "Could not login",
            });
            return;
        }
        setUU({
            loginState: LoginState.LoggedIn,
            user: loginReturn.user,
            logout,
        });
    }

    async function logout(): Promise<void> {
        setUU({ loginState: LoginState.LoggingOut });
        const _success = await attemptLogout();
        setUU({
            loginState: LoginState.LoggedOut,
            login,
            loginErr: "",
        });
    }

    return uu;

}
