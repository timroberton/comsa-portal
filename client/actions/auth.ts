import axios from "axios";
import { DeleteUserRequest, LoginReturn, NewUserRequest, User } from "../types";
import { _HOST } from "../urls";

axios.defaults.withCredentials = true; // Need this for cookies

export async function attemptGetUser(): Promise<User | undefined> {
    try {
        const res = await axios.get<User>(`${_HOST}/user`);
        return res.data;
    }
    catch {
        return undefined;
    }
};

export async function attemptLogin(email: string, password: string): Promise<LoginReturn | undefined> {
    try {
        const res = await axios.post<LoginReturn>(`${_HOST}/login`, { email, password });
        if (!res.data) {
            return undefined;
        }
        return res.data;
    }
    catch {
        return undefined;
    }
};

export async function attemptLogout(): Promise<string | undefined> {
    try {
        const res = await axios.get(`${_HOST}/logout`);
        return "success";
    }
    catch {
        return undefined;
    }
};

export async function resetPassword(email: string, password: string): Promise<string | undefined> {
    try {
        const res = await axios.post(`${_HOST}/reset_password`, { email, password });
        return "success";
    }
    catch {
        return undefined;
    }
};

export async function newUser(nur: NewUserRequest): Promise<string | undefined> {
    try {
        const res = await axios.post(`${_HOST}/new_user`, nur);
        return "success";
    }
    catch {
        return undefined;
    }
};

export async function updateUser(u: User): Promise<string | undefined> {
    try {
        const res = await axios.post(`${_HOST}/update_user`, u);
        return "success";
    }
    catch {
        return undefined;
    }
};

export async function deleteUser(dur: DeleteUserRequest): Promise<string | undefined> {
    try {
        const res = await axios.post(`${_HOST}/delete_user`, dur);
        return "success";
    }
    catch {
        return undefined;
    }
};