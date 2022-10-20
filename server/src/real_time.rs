use super::*;

pub async fn analyze_one_inner(
    analysis_id: &String,
    sender: &Sender<RealTimeMessage>,
    temp_path: &PathBuf,
) -> Option<()> {
    send_stage(Stage::InitializeAnalysis, StageResult::Pending, sender).ok()?;
    let a = match get_analysis_package(analysis_id) {
        Some(v) => v,
        None => {
            send_stage(Stage::InitializeAnalysis, StageResult::Failure, sender).ok()?;
            return None;
        }
    };

    send_stage(Stage::InitializeAnalysis, StageResult::Success, sender).ok()?;
    send_stage(Stage::ImportInputFiles, StageResult::Pending, sender).ok()?;
    let imported = import_files(temp_path, &a);
    if !imported {
        send_stage(Stage::ImportInputFiles, StageResult::Failure, sender).ok()?;
        return None;
    }
    send_stage(Stage::ImportInputFiles, StageResult::Success, sender).ok()?;
    send_stage(Stage::CleanRun, StageResult::Pending, sender).ok()?;

    let clean_run = if a.metadata.language == LanguageType::Stata {
        run_stata(temp_path, sender).await
    } else {
        run_r(temp_path, sender).await
    };

    if clean_run.is_none() {
        send_stage(Stage::CleanRun, StageResult::Failure, sender).ok()?;
        return None;
    }
    send_stage(Stage::CleanRun, StageResult::Success, sender).ok()?;
    send_stage(Stage::OutputFiles, StageResult::Pending, sender).ok()?;
    let all_files_stored = store_outputs(temp_path, &a);
    if !all_files_stored {
        send_stage(Stage::OutputFiles, StageResult::Failure, sender).ok()?;
        return None;
    }
    send_stage(Stage::OutputFiles, StageResult::Success, sender).ok()?;
    Some(())
}

fn import_files(temp_path: &PathBuf, a: &AnalysisPackage) -> bool {
    // Script
    let code_file_path = temp_path.join(_FILE_NAME_MYSCRIPT);
    let res1 = write(code_file_path, format!("{}\r\n", &a.code));
    if res1.is_err() {
        return false;
    }

    // Input files
    for input in &a.metadata.inputs {
        let fr_path = get_path_to_file(&input.folder_type, &input.analysis_id, &input.file_name);
        let to_path = temp_path.join(&input.file_name);
        let res2 = copy(fr_path, to_path);
        if res2.is_err() {
            return false;
        }
    }
    true
}

fn store_outputs(temp_path: &PathBuf, a: &AnalysisPackage) -> bool {
    let mut all_successful = true;
    for output in &a.metadata.outputs {
        let fr_path = temp_path.join(&output.file_name);
        if metadata(&fr_path).is_err() {
            all_successful = false;
            continue;
        }
        let to_path = PathBuf::from(_ANALYSES_FOLDER)
            .join(&a.id)
            .join(&output.file_name);
        if copy(fr_path, to_path).is_err() {
            all_successful = false;
            continue;
        }
    }
    all_successful
}

/////////////////////////////////////////////
/////////////////////////////////////////////
/////////////////////////////////////////////
/////////////////////////////////////////////

fn send_stage(
    stage: Stage,
    stage_result: StageResult,
    sender: &Sender<RealTimeMessage>,
) -> Result<(), tokio::sync::mpsc::error::TrySendError<RealTimeMessage>> {
    let rtm = RealTimeMessage {
        msg_type: MessageType::Stage,
        stage: Some(stage),
        stage_result: Some(stage_result),
        log: None,
    };
    sender.try_send(rtm)
}
