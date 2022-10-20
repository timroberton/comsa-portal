import React, { useEffect } from "react";
import { LoginState, UseUser } from "../hooks/use_user";
import router from "next/router";

type UserBoundaryProps = {
    uu: UseUser,
};

export const UserBoundary: React.FC<UserBoundaryProps> = ({ children, uu }) => {

    useEffect(() => {
        if (uu.loginState === LoginState.LoggedOut) {
            router.push('/login');
        }
    }, [uu.loginState]);

    if (uu.loginState === LoginState.LoggingOut || uu.loginState === LoginState.LoggedOut) {
        return <div className="px-8 py-6">Logging out...</div>;
    }

    if (uu.loginState === LoginState.LoggingIn) {
        return <div className="px-8 py-6">Logging in...</div>;
    }

    return <>
        {children}
    </>;

}