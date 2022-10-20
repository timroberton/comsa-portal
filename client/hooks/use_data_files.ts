import path from "path";
import { useEffect, useRef, useState } from "react";
import { getAllDataFiles, getODKListFiles } from "../actions/crud";
import { _ODK_FILE_LIST_FILENAME } from "../consts";
import { DataFile } from "../types";
import { LoginState } from "./use_user";

export type UseDataFiles = {
    dataFiles: DataFile[],
    loading: boolean,
    err: string,
    //
    updateDataFiles: (newDataFiles: DataFile[]) => void,
    refreshDataFiles: () => Promise<void>,
};

export function useDataFiles(loginState: LoginState): UseDataFiles {

    const [dataFiles, setDataFiles] = useState<DataFile[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [err, setErr] = useState<string>("");

    const odkFileList = useRef<string[]>([]);

    async function refreshDataFiles() {
        setLoading(true);
        setErr("");
        const dataFiles = await getAllDataFiles();
        if (!dataFiles) {
            setErr("Could not reach server");
            setLoading(false);
            return;
        }
        const newODKFileList = await getODKListFiles();

        odkFileList.current = newODKFileList
            ? newODKFileList.map(a => path.parse(a).base)
            : [];

        updateDataFiles(dataFiles);
        setLoading(false);
    }

    function updateDataFiles(newDataFiles: DataFile[]): void {
        newDataFiles.sort((a, b) => a.fileName.toLowerCase() < b.fileName.toLowerCase() ? -1 : 1);
        const newDataFilesWithoutODKListFile = newDataFiles.filter(a => a.fileName !== _ODK_FILE_LIST_FILENAME);
        newDataFilesWithoutODKListFile.forEach(a => {
            a.isODKFile = odkFileList.current.includes(a.fileName);
        });
        setDataFiles(newDataFilesWithoutODKListFile);
    }

    useEffect(() => {
        if (loginState !== LoginState.LoggedIn) {
            return;
        }
        refreshDataFiles();
    }, [loginState]);

    return {
        dataFiles,
        loading,
        err,
        //
        updateDataFiles,
        refreshDataFiles,
    };

}