#[macro_use]
extern crate rocket;

use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::offset::Utc;
use chrono::DateTime;
use linemux::MuxedLines;
use rocket::data::{Limits, ToByteUnit};
use rocket::form::Form;
use rocket::fs::{FileName, FileServer, NamedFile, TempFile};
use rocket::http::{Cookie, CookieJar, SameSite};
use rocket::request::FromParam;
use rocket::request::{self, FromRequest, Request};
use rocket::response::stream::{Event, EventStream};
use rocket::serde::json::Json;
use rocket::tokio::select;
use rocket::tokio::sync::mpsc::Sender;
use rocket::tokio::time::{sleep, Duration};
use rocket::Shutdown;
use rocket::State;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::io::AsyncBufReadExt;

use std::fs::{
    copy, metadata, read_dir, read_to_string, remove_dir_all, remove_file, write, DirBuilder,
};
use std::path::{Path, PathBuf};
use uuid::Uuid;

mod cors;
mod types;
use types::*;
mod run_r;
mod run_stata;
mod utils;
use run_r::*;
use run_stata::*;
use utils::*;
mod real_time;
use real_time::*;
mod users_and_sessions;
use users_and_sessions::*;

const _FILE_NAME_MYSCRIPT: &str = ".script";
const _FILE_NAME_STATALOG: &str = ".log";
const _FILE_NAME_MYMETADATA: &str = ".metadata.json";

const _USERS_FILE_PATH: &str = "./admin/users.json";
const _TOPICS_FILE_PATH: &str = "./admin/topics.json";

const _ADMIN_FOLDER: &str = "./admin";
const _ANALYSES_FOLDER: &str = "./analyses";
const _DATA_FOLDER: &str = "./data";
const _HTML_FOLDER: &str = "./html";
const _TEMP_FOLDER: &str = "./temp";

struct DownloadFile(NamedFile);

impl<'r> rocket::response::Responder<'r, 'static> for DownloadFile {
    fn respond_to(
        self,
        req: &'r rocket::request::Request<'_>,
    ) -> rocket::response::Result<'static> {
        rocket::response::Response::build_from(self.0.respond_to(req)?)
            .raw_header("Content-Disposition", "attachment")
            .ok()
    }
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
////////////// Main "state" vars ////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

#[get("/analyses")]
async fn get_all_analyses(
    _user: UserWithRoles,
) -> Option<Json<Vec<AnalysisSummaryWithSchedulerOrder>>> {
    let analyses = get_list_of_analyses()?;
    let analysis_ids = get_analysis_ids_for_scheduler_in_order(analyses.clone())?;
    let analyses_with_order: Vec<AnalysisSummaryWithSchedulerOrder> = analyses
        .into_iter()
        .map(|x| {
            let order = match analysis_ids.iter().position(|e| e == &x.id) {
                Some(v) => v + 1,
                None => 0,
            };
            AnalysisSummaryWithSchedulerOrder {
                id: x.id,
                metadata: x.metadata,
                order,
            }
        })
        .collect();
    Some(Json(analyses_with_order))
}

#[get("/datafiles")]
fn get_all_data_files(_user: UserWithRoles) -> Option<Json<Vec<DataFile>>> {
    let data_files = get_list_of_data_files()?;
    Some(Json(data_files))
}
/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
///////////////////// Topics ////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

#[get("/topics")]
async fn get_all_topics(_user: UserWithRoles) -> Option<Json<Vec<Topic>>> {
    let topics = get_topics()?;
    Some(Json(topics))
}

#[post("/updatetopics", format = "application/json", data = "<ut>")]
async fn update_topics(user: UserWithRoles, ut: Json<Vec<Topic>>) -> Option<()> {
    if !user.can_edit {
        return None;
    }
    let new_topics = ut.into_inner();
    save_new_topics(new_topics)?;
    Some(())
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
//////////// CHECK AND STREAM FILES /////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

#[get("/cf/<folder_type>/<analysis_id>/<file_name>")]
fn check_file(
    _user: UserWithRoles,
    folder_type: FolderType,
    analysis_id: String,
    file_name: String,
) -> Json<CheckFileResponse> {
    match get_check_file_response(folder_type, &analysis_id, &file_name) {
        Some(v) => Json(v),
        None => Json(CheckFileResponse {
            exists: false,
            date: "".to_string(),
            size: 0,
            public: false,
        }),
    }
}

#[get("/pvf/<folder_type>/<analysis_id>/<file_name>")]
async fn stream_private_file(
    _user: UserWithRoles,
    folder_type: FolderType,
    analysis_id: String,
    file_name: String,
) -> Option<DownloadFile> {
    let path = get_path_to_file(&folder_type, &analysis_id, &file_name);
    NamedFile::open(path).await.ok().map(|nf| DownloadFile(nf))
}

#[get("/exf/<analysis_id>/<file_name>")]
async fn stream_public_file(analysis_id: String, file_name: String) -> Option<DownloadFile> {
    match get_file_public_status(&analysis_id, &file_name) {
        None => None,
        Some(false) => None,
        Some(true) => {
            let path = get_path_to_file(&FolderType::Analysis, &analysis_id, &file_name);
            NamedFile::open(path).await.ok().map(|nf| DownloadFile(nf))
        }
    }
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
//////////////////// ANALYSIS ///////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

#[get("/analysis/<analysis_id>")]
fn get_analysis(_user: UserWithRoles, analysis_id: String) -> Option<Json<AnalysisPackage>> {
    let a = get_analysis_package(&analysis_id)?;
    Some(Json(a))
}

#[post("/createanalysis", format = "application/json", data = "<na>")]
fn create_analysis(
    user: UserWithRoles,
    na: Json<NewAnalysis>,
) -> Option<Json<Vec<AnalysisSummary>>> {
    if !user.can_edit {
        return None;
    }
    if na.name.len() == 0 {
        return None;
    }
    let uuid = Uuid::new_v4();
    let analysis_id = uuid.to_string();
    let mut folder_path = PathBuf::from(_ANALYSES_FOLDER).join(&analysis_id);

    while Path::new(&folder_path).exists() {
        let uuid = Uuid::new_v4();
        let analysis_id = uuid.to_string();
        folder_path = PathBuf::from(_ANALYSES_FOLDER).join(&analysis_id);
    }

    DirBuilder::new()
        .recursive(false)
        .create(&folder_path)
        .ok()?;

    // Update code
    let code_file_path = folder_path.join(_FILE_NAME_MYSCRIPT);
    write(code_file_path, "").ok()?;

    // Update metadata
    let metadata_file_path = folder_path.join(_FILE_NAME_MYMETADATA);
    let amd = AnalysisMetaData::new(
        &na.name,
        &na.language,
        &na.topic,
        &na.tags,
        na.scheduled,
        &user.email,
    );
    let json_string = serde_json::to_string_pretty(&amd).ok()?;
    write(metadata_file_path, json_string).ok()?;

    let analyses = get_list_of_analyses()?;
    Some(Json(analyses))
}

#[get("/deleteanalysis/<analysis_id>")]
fn delete_analysis(user: UserWithRoles, analysis_id: String) -> Option<Json<Vec<AnalysisSummary>>> {
    if !user.can_edit {
        return None;
    }
    let folder_path = PathBuf::from(_ANALYSES_FOLDER).join(&analysis_id);
    remove_dir_all(folder_path).ok()?;
    let analyses = get_list_of_analyses()?;
    Some(Json(analyses))
}

#[post("/updateanalysis", format = "application/json", data = "<ap>")]
fn update_analysis(
    user: UserWithRoles,
    ap: Json<AnalysisPackage>,
) -> Option<Json<AnalysisPackage>> {
    if !user.can_edit {
        return None;
    }
    let folder_path = PathBuf::from(_ANALYSES_FOLDER).join(&ap.id);

    // Update code
    let code_file_path = folder_path.join(_FILE_NAME_MYSCRIPT);
    write(code_file_path, &ap.code).ok()?;

    // Update metadata
    let metadata_file_path = folder_path.join(_FILE_NAME_MYMETADATA);
    let mut m = get_metadata_from_path(&metadata_file_path)?;
    m.name = ap.metadata.name.clone();
    m.language = ap.metadata.language.clone();
    m.inputs = ap.metadata.inputs.clone();
    m.outputs = ap.metadata.outputs.clone();
    m.topic = ap.metadata.topic.clone();
    m.tags = ap.metadata.tags.clone();
    m.scheduled = ap.metadata.scheduled;
    m.last_modified_at = chrono::Utc::now();
    m.last_modified_by = user.email.clone();
    let json_string = serde_json::to_string_pretty(&m).ok()?;
    write(metadata_file_path, json_string).ok()?;

    // Get new analysis package
    let a = get_analysis_package(&ap.id)?;
    Some(Json(a))
}

#[get("/run/<analysis_id>")]
async fn run(
    user: UserWithRoles,
    mut end: Shutdown,
    analysis_id: String,
    ttq: &State<TimTicketQueue>,
) -> EventStream![] {
    let mut tq = ttq.ticket_queue.clone();

    // Make this buffer BIG (e.g. 65536) because scripts can output a lot of log messages at once, causing it to fill up
    let (sender, mut receiver) = tokio::sync::mpsc::channel::<RealTimeMessage>(65536);
    let jh = rocket::tokio::spawn(async move {
        let (temp_path, id) = tq.add();
        let mut position_in_queue = tq.get_position(&id);
        while position_in_queue > 3 {
            match sender.try_send(RealTimeMessage {
                msg_type: MessageType::Waiting,
                stage: None,
                stage_result: None,
                log: Some(format!(
                    "Waiting for {} other analyses to finish",
                    position_in_queue
                )),
            }) {
                Ok(()) => {}
                Err(_) => {
                    tq.remove(&id);
                    return;
                }
            }
            sleep(Duration::from_millis(2000)).await;
            position_in_queue = tq.get_position(&id);
        }
        let (end_status, msg_type) =
            match analyze_one_inner(&analysis_id, &sender, &temp_path).await {
                Some(_) => (StageResult::Success, MessageType::EndSuccess),
                None => (StageResult::Failure, MessageType::EndFailure),
            };
        let _ =
            update_metadata_after_run(&analysis_id, chrono::Utc::now(), &user.email, &end_status);
        let _ = sender.try_send(RealTimeMessage {
            msg_type,
            stage: None,
            stage_result: None,
            log: None,
        });
        tq.remove(&id);
    });

    EventStream! {
        loop {
            let msg = select! {
                msg = receiver.recv() => {
                    match msg {
                    Some(msg) => msg,
                    None => {
                        println!("Analysis process finished completely and sender closed.");
                        break;
                    },
                }
                },
                _ = &mut end => {
                    println!("Server was shutdown");
                    jh.abort();
                    break;
                },
            };
            yield Event::json(&msg);
        }
    }
}

#[get("/queue")]
async fn get_queue(ttq: &State<TimTicketQueue>) -> String {
    let t: Vec<Ticket> = ttq.ticket_queue.lock().unwrap().clone();
    serde_json::to_string_pretty(&t).unwrap()
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////// Scheduler ///////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

#[get("/start_scheduler")]
async fn start_scheduler(scheduler_sender: &State<Sender<SchedulerCommand>>) -> Option<()> {
    let _ = scheduler_sender.send(SchedulerCommand::Start).await;
    Some(())
}

#[get("/stop_scheduler")]
async fn stop_scheduler(scheduler_sender: &State<Sender<SchedulerCommand>>) -> Option<()> {
    let _ = scheduler_sender.send(SchedulerCommand::Stop).await;
    Some(())
}

#[get("/info_scheduler")]
async fn info_scheduler(tsch: &State<TimScheduler>) -> Json<bool> {
    Json(tsch.should_run.lock().unwrap().is_some())
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
//////////////// Uploaded files /////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
#[derive(FromForm)]
struct Upload<'f> {
    actualfiledata: TempFile<'f>,
}

#[post("/upload", data = "<form>")]
async fn upload_data_file(user: UserWithRoles, mut form: Form<Upload<'_>>) -> Option<()> {
    if !user.can_edit {
        return None;
    }
    let file_name = form
        .actualfiledata
        .raw_name()
        .unwrap_or(FileName::new("unknown"));
    let file_name_str = file_name.dangerous_unsafe_unsanitized_raw().as_str();
    let upload_folder_path = PathBuf::from(_DATA_FOLDER).join(file_name_str);
    form.actualfiledata
        .persist_to(&upload_folder_path)
        .await
        .ok()
}

#[get("/deletedatafile/<file_name>")]
fn delete_data_file(user: UserWithRoles, file_name: String) -> Option<Json<Vec<DataFile>>> {
    if !user.can_edit {
        return None;
    }
    let file_path = PathBuf::from(_DATA_FOLDER).join(&file_name);
    remove_file(file_path).ok()?;
    let data_files = get_list_of_data_files()?;
    Some(Json(data_files))
}
/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
////////////////// *** MAIN *** /////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

#[rocket::main]
async fn main() {
    run_startup_checker();

    let tsm = TimSessionsMap::new_instance();

    let ttq = TimTicketQueue {
        ticket_queue: Arc::new(Mutex::new(Vec::new())),
    };

    let tsch = TimScheduler {
        should_run: Arc::new(Mutex::new(None)),
    };

    // These three get moved into scheduler
    let tq_1 = ttq.ticket_queue.clone();
    let should_run_1 = tsch.should_run.clone();
    let (scheduler_sender, mut scheduler_receiver) =
        tokio::sync::mpsc::channel::<SchedulerCommand>(16);

    rocket::tokio::spawn(async move {
        loop {
            let cmd = scheduler_receiver.recv().await.unwrap();
            let mut should_run_lock = should_run_1.lock().unwrap();
            if cmd == SchedulerCommand::Stop {
                *should_run_lock = None;
                continue;
            }
            let run_id = Uuid::new_v4();
            *should_run_lock = Some(run_id);

            drop(should_run_lock);
            let mut tq_2 = tq_1.clone();
            let should_run_2 = should_run_1.clone();
            let should_run_3 = should_run_1.clone();
            let run_id_2 = run_id.clone();
            let _ = rocket::tokio::spawn(async move {
                let (sender_to_nowhere, mut recevier_to_nowhere) =
                    tokio::sync::mpsc::channel::<RealTimeMessage>(65536);
                let jh_recv = rocket::tokio::spawn(async move {
                    while let Some(_) = recevier_to_nowhere.recv().await {
                        let should_run_lock = should_run_2.lock().unwrap();
                        match *should_run_lock {
                            Some(v) => {
                                if v != run_id_2 {
                                    break;
                                }
                            }
                            None => {
                                break;
                            }
                        }
                    }
                });
                let analyses = get_list_of_analyses().unwrap();
                let mut analysis_ids = get_analysis_ids_for_scheduler_in_order(analyses).unwrap();
                analysis_ids.reverse();
                while let Some(analysis_id) = analysis_ids.pop() {
                    let (temp_path, id) = tq_2.add();
                    let end_status =
                        match analyze_one_inner(&analysis_id, &sender_to_nowhere, &temp_path).await
                        {
                            Some(_) => StageResult::Success,
                            None => StageResult::Failure,
                        };
                    let _ = update_metadata_after_run(
                        &analysis_id,
                        chrono::Utc::now(),
                        &"Scheduler".to_string(),
                        &end_status,
                    );
                    tq_2.remove(&id);
                }
                jh_recv.abort();
                let mut should_run_lock = should_run_3.lock().unwrap();
                if should_run_lock.is_none() {
                    return;
                }
                if should_run_lock.unwrap() == run_id_2 {
                    *should_run_lock = None;
                }
            });
        }
    });

    let figment = rocket::Config::figment()
        .merge((
            "limits",
            Limits::default()
                .limit("file", 10.gigabytes())
                .limit("form", 10.gigabytes())
                .limit("data-form", 10.gigabytes()),
        ))
        .merge(("temp_dir", _DATA_FOLDER)) // Use DATA_FOLDER to address upload volumes issue
        .merge(("address", "0.0.0.0"))
        .merge(("port", 9000));

    let _ = rocket::custom(figment)
        .manage(scheduler_sender)
        .manage(tsm)
        .manage(ttq)
        .manage(tsch)
        // .manage(tsjh)
        .mount(
            "/api",
            routes![
                get_all_analyses,
                get_all_data_files,
                //
                get_all_topics,
                update_topics,
                //
                upload_data_file,
                delete_data_file,
                //
                get_analysis,
                create_analysis,
                delete_analysis,
                update_analysis,
                run,
                get_queue,
                //
                check_file,
                stream_private_file,
                stream_public_file,
                //
                start_scheduler,
                stop_scheduler,
                info_scheduler,
            ],
        )
        .mount("/api", user_routes())
        .mount("/", FileServer::from(_HTML_FOLDER).rank(2))
        .attach(cors::CORS())
        .launch()
        .await;
}
