use super::*;

pub fn run_startup_checker() {
    println!("\n\nRunning pre-flight check...");
    check_path(_ADMIN_FOLDER, "Admin folder");
    check_path(_USERS_FILE_PATH, "Users file");
    check_path(_TOPICS_FILE_PATH, "Topics file");
    check_path(_ANALYSES_FOLDER, "Analyses folder");
    check_path(_DATA_FOLDER, "Data folder");
    check_path(_HTML_FOLDER, "HTML folder");
    check_path(_TEMP_FOLDER, "Temp folder");
    println!("\nAll good!\n");
}

fn check_path(p: &str, label: &str) {
    if Path::new(p).exists() {
        println!("{} exists", label);
    } else {
        println!("ERROR! {} does not exist\n", label);
        panic!("ERROR! {} does not exist\n\n", label);
    }
}

pub fn get_list_of_analyses() -> Option<Vec<AnalysisSummary>> {
    let mut analyses: Vec<AnalysisSummary> = Vec::new();
    let analyses_path = PathBuf::from(_ANALYSES_FOLDER);
    for entry in read_dir(analyses_path).ok()? {
        let folder = entry.ok()?;
        if !folder.path().is_dir() {
            continue;
        }
        let metadata_file_path = folder.path().join(_FILE_NAME_MYMETADATA);
        let analysis = AnalysisSummary {
            id: folder.file_name().into_string().ok()?,
            metadata: get_metadata_from_path(&metadata_file_path)?,
        };
        analyses.push(analysis);
    }
    Some(analyses)
}

pub fn get_analysis_ids_for_scheduler_in_order(
    mut analyses: Vec<AnalysisSummary>,
) -> Option<Vec<String>> {
    // Put in alpha order for cleanliness (must do this before selecting based on dependencies)
    analyses.sort_by(|a, b| {
        a.metadata
            .name
            .to_lowercase()
            .cmp(&b.metadata.name.to_lowercase())
    });
    let mut analyses_for_scheduler: Vec<AnalysisSummary> = Vec::new();
    while analyses.len() > 0 {
        let mut none_added = true;
        for a in analyses.iter() {
            let any_notready_deps: bool = a.metadata.inputs.iter().any(|x| {
                x.folder_type == FolderType::Analysis
                    && !analyses_for_scheduler.iter().any(|e| e.id == x.analysis_id)
            });
            if !any_notready_deps {
                analyses_for_scheduler.push(a.clone());
                none_added = false;
            }
        }
        if none_added {
            break;
        }
        analyses.retain(|x| !analyses_for_scheduler.iter().any(|e| e.id == x.id));
    }
    // Only include those that are scheduled (but do this after ordering)
    analyses_for_scheduler.retain(|x| x.metadata.scheduled);
    let analysis_ids = analyses_for_scheduler
        .iter()
        .map(|x| x.id.clone())
        .collect();
    Some(analysis_ids)
}

pub fn get_list_of_data_files() -> Option<Vec<DataFile>> {
    let mut data_files: Vec<DataFile> = Vec::new();
    let data_path = PathBuf::from(_DATA_FOLDER);
    for entry in read_dir(data_path).ok()? {
        let file = entry.ok()?;
        let fpath = file.path();
        if fpath.is_dir() {
            continue;
        }
        let m = metadata(fpath).ok()?;
        let system_time = m.modified().ok()?;
        let datetime: DateTime<Utc> = system_time.into();
        data_files.push(DataFile {
            file_name: file.file_name().into_string().ok()?,
            date: datetime.to_rfc3339().to_string(),
            size: m.len(),
        });
    }
    Some(data_files)
}

pub fn get_topics() -> Option<Vec<Topic>> {
    let topics_file_path = PathBuf::from(_TOPICS_FILE_PATH);
    let topics_str = read_to_string(topics_file_path).ok()?;
    serde_json::from_str(&topics_str).ok()?
}

pub fn save_new_topics(new_topics: Vec<Topic>) -> Option<()> {
    let topics_file_path = PathBuf::from(_TOPICS_FILE_PATH);
    let new_topics_str = serde_json::to_string_pretty(&new_topics).ok()?;
    write(topics_file_path, new_topics_str).ok()?;
    Some(())
}

pub fn get_check_file_response(
    folder_type: FolderType,
    analysis_id: &String,
    file_name: &String,
) -> Option<CheckFileResponse> {
    let path = get_path_to_file(&folder_type, analysis_id, file_name);
    let m = metadata(path).ok()?;
    let system_time = m.modified().ok()?;
    let public = if folder_type == FolderType::Data {
        false
    } else {
        get_file_public_status(analysis_id, file_name).unwrap_or(false)
    };
    let datetime: DateTime<Utc> = system_time.into();
    Some(CheckFileResponse {
        exists: true,
        date: datetime.to_rfc3339().to_string(),
        size: m.len(),
        public,
    })
}

pub fn get_users() -> Option<Vec<UserFull>> {
    let users_file_path = PathBuf::from(_USERS_FILE_PATH);
    let users_str = read_to_string(users_file_path).ok()?;
    serde_json::from_str(&users_str).ok()?
}

pub fn save_new_users(new_users: Vec<UserFull>) -> Option<()> {
    let users_file_path = PathBuf::from(_USERS_FILE_PATH);
    let new_users_str = serde_json::to_string_pretty(&new_users).ok()?;
    write(users_file_path, new_users_str).ok()?;
    Some(())
}

pub fn get_file_public_status(analysis_id: &String, file_name: &String) -> Option<bool> {
    // Returns None if file data not found
    // Returns Some(false) if not public
    // Returns Some(true) if public
    let metadata = get_metadata_from_analysis_id(&analysis_id)?;
    let to_check = file_name.clone();
    let file = metadata.outputs.iter().find(|x| x.file_name == to_check)?;
    Some(file.public)
}

pub fn get_analysis_package(analysis_id: &String) -> Option<AnalysisPackage> {
    let folder_path = PathBuf::from(_ANALYSES_FOLDER).join(analysis_id);
    let code_file_path = folder_path.join(_FILE_NAME_MYSCRIPT);
    let metadata_file_path = folder_path.join(_FILE_NAME_MYMETADATA);
    Some(AnalysisPackage {
        id: analysis_id.clone(),
        code: read_to_string(code_file_path).ok()?,
        metadata: get_metadata_from_path(&metadata_file_path)?,
    })
}

pub fn get_path_to_file(
    folder_type: &FolderType,
    analysis_id: &String,
    file_name: &String,
) -> PathBuf {
    match folder_type {
        FolderType::Analysis => PathBuf::from(_ANALYSES_FOLDER)
            .join(analysis_id)
            .join(file_name),
        FolderType::Data => PathBuf::from(_DATA_FOLDER).join(file_name),
        // FolderType::Temp => PathBuf::from(_TEMP_FOLDER)
        //     .join(analysis_id)
        //     .join(file_name),
    }
}

pub fn get_new_temp_path() -> (PathBuf, uuid::Uuid) {
    let mut temp_id = Uuid::new_v4();
    let mut temp_path = PathBuf::from(_TEMP_FOLDER).join(temp_id.to_string());

    while Path::new(&temp_path).exists() {
        temp_id = Uuid::new_v4();
        temp_path = PathBuf::from(_TEMP_FOLDER).join(temp_id.to_string());
    }

    DirBuilder::new()
        .recursive(false)
        .create(&temp_path)
        .unwrap();

    (temp_path, temp_id)
}

pub fn update_metadata_after_run(
    analysis_id: &String,
    last_run_at: DateTime<Utc>,
    last_run_by: &String,
    last_status: &StageResult,
) -> Option<()> {
    let metadata_file_path = PathBuf::from(_ANALYSES_FOLDER)
        .join(analysis_id)
        .join(_FILE_NAME_MYMETADATA);
    let mut metadata = get_metadata_from_path(&metadata_file_path)?;
    metadata.last_run_at = last_run_at;
    metadata.last_run_by = last_run_by.clone();
    metadata.last_status = last_status.clone();
    let json_string = serde_json::to_string_pretty(&metadata).ok()?;
    write(metadata_file_path, json_string).ok()?;
    Some(())
}

pub fn get_metadata_from_analysis_id(analysis_id: &String) -> Option<AnalysisMetaData> {
    let metadata_file_path = PathBuf::from(_ANALYSES_FOLDER)
        .join(analysis_id)
        .join(_FILE_NAME_MYMETADATA);
    get_metadata_from_path(&metadata_file_path)
}

pub fn get_metadata_from_path(metadata_file_path: &PathBuf) -> Option<AnalysisMetaData> {
    let metadata_str = read_to_string(metadata_file_path).ok()?;
    serde_json::from_str(&metadata_str).ok()
}
