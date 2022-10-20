import React, { useRef, useState } from 'react';
import { FolderType } from "../types";
import { humanFileSize, selectElementContents } from "../utils";
import { _HOST } from "../urls";
import { useCFR } from '../hooks/use_cfr';

type FileStatusProps = {
    folderType: FolderType,
    analysisId: string,
    fileName: string,
    needsSaving: boolean,
};

export const FileStatus: React.FC<FileStatusProps> = (p) => {

    const cfr = useCFR(p.folderType, p.analysisId, p.fileName, p.needsSaving);

    const [copied, setCopied] = useState<boolean>(false);
    const ref = useRef<HTMLAnchorElement>(null);

    function copyToClip() {
        if (ref.current) {
            selectElementContents(ref.current);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 1000);
        }
    }

    const url = (cfr && cfr.exists)
        ? (cfr.public ? `${_HOST}/exf/${p.analysisId}/${p.fileName}` : `${_HOST}/pvf/${p.folderType}/${p.analysisId}/${p.fileName}`)
        : "";

    return p.needsSaving
        ? <div className="text-sm text-gray-500">Save to confirm status</div>
        : !cfr
            ? <div className="text-sm text-gray-500">Checking file...</div>
            : (cfr.exists
                ? (cfr.public
                    ? <div className="text-sm">
                        <a
                            ref={ref}
                            className="break-all ui-link"
                            href={url}
                            download
                            target="_blank">
                            {"https://portal.comsa.org.mz" + url}
                        </a>
                        <div className="mt-1">
                            {/* <span className="text-green-600">Public file available</span> */}
                            <span
                                className="px-2 py-1 text-xs ui-btn-lightgray"
                                onClick={copyToClip}
                            >
                                {copied ? "Copied!" : "Copy link"}
                            </span>
                            <span className="ml-2">
                                Last modified: {(new Date(cfr.date)).toLocaleString()}
                            </span>
                            <span className="ml-2">
                                Size: {humanFileSize(cfr.size)}
                            </span>
                        </div>
                    </div>
                    : <div className="text-sm">
                        {/* <span className="text-green-600">Private file available</span> */}
                        <a
                            ref={ref}
                            className="ui-link"
                            href={url}
                            download
                            target="_blank">
                            Download
                        </a>
                        <span className="ml-2">
                            Last modified: {(new Date(cfr.date)).toLocaleString()}
                        </span>
                        <span className="ml-2">
                            Size: {humanFileSize(cfr.size)}
                        </span>
                    </div>
                )
                : <div className="text-sm text-red-500">Does not exist</div>
            );

};

type FileLinkProps = {
    url: string,
    linkLabel: string,
};

export const FileLink: React.FC<FileLinkProps> = ({ url, linkLabel }) => {
    return <a
        className="ui-link"
        href={url}
        download
        target="_blank">
        {linkLabel}
    </a>;
}
