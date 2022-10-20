import { useEffect, useState } from "react";
import { UIButton, UIColor } from "../components/ui";
import { Modal, ModalActions } from "../components/modals";
import Uppy from '@uppy/core'
import XHRUpload from '@uppy/xhr-upload';
import { DragDrop, StatusBar } from '@uppy/react';
import { _HOST } from "../urls";
import '@uppy/core/dist/style.css';
import '@uppy/drag-drop/dist/style.css';
import '@uppy/progress-bar/dist/style.css'
import '@uppy/status-bar/dist/style.css';

const uppy1 = Uppy({
    allowMultipleUploads: true,
    autoProceed: true,
});

uppy1.use(XHRUpload, {
    endpoint: `${_HOST}/upload`,
    withCredentials: true,
    formData: true,
    fieldName: "actualfiledata",
});

type UploaderProps = {
    cancel: () => void,
    refreshDataFiles: () => Promise<void>,
};

enum UploadingState {
    WaitingForDrop,
    Uploading,
    Complete,
    RefreshingFiles,
}

export const Uploader: React.FC<UploaderProps> = (p) => {

    const [uploadingState, setUploadingState] = useState<UploadingState>(UploadingState.WaitingForDrop);

    useEffect(() => {
        uppy1.on('upload', (data) => {
            setUploadingState(UploadingState.Uploading);
        });
        uppy1.on('progress', (progress) => {
        });
        uppy1.on('complete', (result) => {
            setUploadingState(UploadingState.Complete);
        });
    }, []);

    function uploadMore() {
        uppy1.reset();
        setUploadingState(UploadingState.WaitingForDrop);
    }

    function stop() {
        uppy1.reset();
        setUploadingState(UploadingState.WaitingForDrop);
    }

    async function closeUploader() {
        setUploadingState(UploadingState.RefreshingFiles);
        await p.refreshDataFiles();
        p.cancel();
        uppy1.reset();
    }

    return <Modal
        cancel={closeUploader}
        minWidth={600}
    >
        {uploadingState === UploadingState.WaitingForDrop && <>
            <DragDrop
                uppy={uppy1}
            />
            <ModalActions>
                <UIButton
                    label="Cancel"
                    onClick={closeUploader}
                />
            </ModalActions>
        </>}
        {uploadingState === UploadingState.Uploading && <>
            <StatusBar
                uppy={uppy1}
                hideUploadButton
                hideAfterFinish={false}
                showProgressDetails
            />
            <ModalActions>
                <UIButton
                    label="Cancel upload"
                    onClick={stop}
                />
            </ModalActions>
        </>}
        {uploadingState === UploadingState.Complete && <>
            <StatusBar
                uppy={uppy1}
                hideUploadButton
                hideAfterFinish={false}
                showProgressDetails
            />
            <ModalActions>
                <UIButton
                    label="Done"
                    onClick={closeUploader}
                    color={UIColor.Blue}
                />
                <UIButton
                    label="Upload more files"
                    onClick={uploadMore}
                    marginLeft
                />
            </ModalActions>
        </>}
        {uploadingState === UploadingState.RefreshingFiles && <>
            <div className="">Updating files...</div>
        </>}
    </Modal>;

};
