import Head from "next/head";
import { NextPage } from "next";
import { deleteDataFile } from "../actions/crud";
import { FolderType } from "../types";
import { FileLink } from "../components/file_status";
import { humanFileSize } from "../utils";
import { Frame1 } from "../components/frame_1";
import { _HOST } from "../urls";
import { useEffect, useMemo, useState } from "react";
import { Uploader } from "../components/uploader";
import { LoginState, UseUser } from "../hooks/use_user";
import { UseDataFiles } from "../hooks/use_data_files";
import {
  ArrowDownIcon,
  RefreshIcon,
  UploadIcon,
} from "@heroicons/react/outline";
import { UIColor } from "../components/ui";
import { Frame2 } from "../components/frame_2";
import { FilterControlsData } from "../components/filter_controls_data";
import { FilterPropertyData, UseUI } from "../hooks/use_ui";

interface IndexProps {
  uu: UseUser;
  ud: UseDataFiles;
  uui: UseUI;
}

const Index: NextPage<IndexProps> = (p) => {
  const [openModal, setOpenModal] = useState<boolean>(false);

  async function attemptDeleteDataFile(fileName: string) {
    if (!window.confirm("Are you sure?")) {
      return;
    }
    const newDataFiles = await deleteDataFile(fileName);
    if (!newDataFiles) {
      alert("Could not delete");
      p.ud.refreshDataFiles();
      return;
    }
    p.ud.updateDataFiles(newDataFiles);
  }

  // useEffect(() => {
  // 	p.ud.refreshDataFiles();
  // }, []);

  const canEdit = p.uu.loginState === LoginState.LoggedIn && p.uu.user.canEdit;

  const filteredDataFiles = useMemo(() => {
    return p.ud.dataFiles
      .filter((a) => {
        return (
          p.uui.searchTextData.trim() === "" ||
          a.fileName
            .toLowerCase()
            .includes(p.uui.searchTextData.trim().toLowerCase())
        );
      })
      .filter((a) => {
        return (
          p.uui.selectedFileType === "" ||
          (p.uui.selectedFileType === "odk" && a.isODKFile) ||
          (p.uui.selectedFileType === "static" && !a.isODKFile)
        );
      });
  }, [p.ud.dataFiles, p.uui.searchTextData, p.uui.selectedFileType]);

  const sortedDataFiles = useMemo(() => {
    const sdf = [...filteredDataFiles];
    switch (p.uui.filterPropertyData) {
      case FilterPropertyData.Name:
        sdf.sort((a, b) =>
          a.fileName.toLowerCase() > b.fileName.toLowerCase() ? 1 : -1
        );
        break;
      case FilterPropertyData.FileType:
        sdf.sort((a, b) => (a.isODKFile ? -1 : 1));
        break;
      case FilterPropertyData.LastModified:
        sdf.sort((a, b) => (a.date < b.date ? 1 : -1));
        break;
      case FilterPropertyData.Size:
        sdf.sort((a, b) => b.size - a.size);
        break;
      default:
    }
    return sdf;
  }, [filteredDataFiles, p.uui.filterPropertyData]);

  return (
    <>
      <Head>
        <title>Analysis Portal</title>
        <link rel="stylesheet" type="text/css" href="/roboto.css" />
      </Head>

      <Frame1
        uu={p.uu}
        page="data"
        title="Data"
        buttons={
          canEdit
            ? [
                {
                  label: "Refresh file listing",
                  onClick: p.ud.refreshDataFiles,
                  icon: RefreshIcon,
                  color: UIColor.LightGray,
                },
                {
                  label: "Upload file",
                  onClick: () => setOpenModal(true),
                  icon: UploadIcon,
                },
              ]
            : [
                {
                  label: "Refresh file listing",
                  onClick: p.ud.refreshDataFiles,
                  icon: RefreshIcon,
                  color: UIColor.LightGray,
                },
              ]
        }
      >
        {p.ud.loading ? (
          <div className="">Loading...</div>
        ) : (
          <Frame2
            filterControls={
              <FilterControlsData
                uui={p.uui}
                nTotal={p.ud.dataFiles.length}
                nFiltered={sortedDataFiles.length}
              />
            }
          >
            {sortedDataFiles.length === 0 ? (
              <div className="py-2 text-sm leading-5 text-gray-400">
                No matching data files
              </div>
            ) : (
              <>
                <li className="grid grid-cols-12 gap-2 py-2 text-sm font-bold leading-5">
                  <div
                    className={`${
                      canEdit ? "col-span-6" : "col-span-7"
                    }  truncate cursor-pointer hover:underline`}
                    onClick={() =>
                      p.uui.updateFilterPropertyData(FilterPropertyData.Name)
                    }
                  >
                    File name
                    {p.uui.filterPropertyData === FilterPropertyData.Name && (
                      <ArrowDownIcon className="inline-block w-3 h-3 ml-1" />
                    )}
                  </div>
                  <div
                    className="flex items-center col-span-1 truncate cursor-pointer hover:underline"
                    onClick={() =>
                      p.uui.updateFilterPropertyData(
                        FilterPropertyData.FileType
                      )
                    }
                  >
                    <span className="flex-shrink inline-block truncate ">
                      File type
                    </span>
                    {p.uui.filterPropertyData ===
                      FilterPropertyData.FileType && (
                      <ArrowDownIcon className="inline-block w-3 h-3 ml-1" />
                    )}
                  </div>
                  <div
                    className="col-span-3 truncate cursor-pointer hover:underline"
                    onClick={() =>
                      p.uui.updateFilterPropertyData(
                        FilterPropertyData.LastModified
                      )
                    }
                  >
                    Last modified
                    {p.uui.filterPropertyData ===
                      FilterPropertyData.LastModified && (
                      <ArrowDownIcon className="inline-block w-3 h-3 ml-1" />
                    )}
                  </div>
                  <div
                    className="col-span-1 truncate cursor-pointer hover:underline"
                    onClick={() =>
                      p.uui.updateFilterPropertyData(FilterPropertyData.Size)
                    }
                  >
                    Size
                    {p.uui.filterPropertyData === FilterPropertyData.Size && (
                      <ArrowDownIcon className="inline-block w-3 h-3 ml-1" />
                    )}
                  </div>
                </li>
                {sortedDataFiles.map((a, i) => {
                  const url = `${_HOST}/pvf/${FolderType.DATA}/x/${a.fileName}`;
                  return (
                    <li
                      key={i}
                      className="grid grid-cols-12 gap-2 py-2 text-sm leading-5 border-t border-gray-200 select-text"
                    >
                      <div
                        className={`${
                          canEdit ? "col-span-6" : "col-span-7"
                        } break-all leading-4`}
                      >
                        <FileLink url={url} linkLabel={a.fileName} />
                      </div>
                      <div className="col-span-1 text-xs truncate">
                        {a.isODKFile ? "ODK" : "Static"}
                      </div>
                      <div className="col-span-3 text-xs truncate">
                        {new Date(a.date).toLocaleString()}
                      </div>
                      <div className="col-span-1 text-xs truncate">
                        {humanFileSize(a.size)}
                      </div>
                      {canEdit && (
                        <div className="col-span-1 text-xs text-right truncate">
                          <span
                            className="text-xs ui-link-gray"
                            onClick={() => attemptDeleteDataFile(a.fileName)}
                          >
                            Delete
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </>
            )}
          </Frame2>
        )}
        {openModal && (
          <Uploader
            cancel={() => setOpenModal(false)}
            refreshDataFiles={p.ud.refreshDataFiles}
          />
        )}
      </Frame1>
    </>
  );
};

export default Index;
