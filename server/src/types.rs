use super::*;

pub struct TimTicketQueue {
    pub ticket_queue: Arc<Mutex<Vec<Ticket>>>,
}

pub struct TimScheduler {
    pub should_run: Arc<Mutex<Option<Uuid>>>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SchedulerCommand {
    Start,
    Stop,
}

pub trait TicketQueue {
    fn add(&mut self) -> (PathBuf, uuid::Uuid);
    fn get_position(&mut self, id: &uuid::Uuid) -> usize;
    fn remove(&mut self, id: &uuid::Uuid);
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Ticket {
    pub id: uuid::Uuid,
    pub temp_path: PathBuf,
    pub date: DateTime<Utc>,
}

impl TicketQueue for Arc<Mutex<Vec<Ticket>>> {
    fn add(&mut self) -> (PathBuf, uuid::Uuid) {
        let (temp_path, id) = get_new_temp_path();
        self.lock().expect("Should unlock").push(Ticket {
            id: id.clone(),
            temp_path: temp_path.clone(),
            date: chrono::Utc::now(),
        });
        (temp_path, id)
    }
    fn get_position(&mut self, id: &uuid::Uuid) -> usize {
        match self
            .lock()
            .expect("Should unlock")
            .iter()
            .position(|x| x.id == *id)
        {
            Some(index) => index,
            None => 0,
        }
    }
    fn remove(&mut self, id: &uuid::Uuid) {
        let mut unlocked = self.lock().expect("Should unlock");
        match unlocked.iter().position(|x| x.id == *id) {
            Some(index) => {
                std::fs::remove_dir_all(&unlocked[index].temp_path)
                    .expect("Should remove temp dir");
                unlocked.remove(index);
            }
            None => {}
        };
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FolderType {
    #[serde(rename = "analysis")]
    Analysis,
    #[serde(rename = "data")]
    Data,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum LanguageType {
    #[serde(rename = "r")]
    R,
    #[serde(rename = "stata")]
    Stata,
}

impl<'r> FromParam<'r> for FolderType {
    type Error = &'r str;
    fn from_param(param: &'r str) -> Result<Self, Self::Error> {
        let json_str = format!("\"{}\"", &param);
        match serde_json::from_str::<FolderType>(&json_str) {
            Ok(ft) => Ok(ft),
            Err(_) => Err(param),
        }
    }
}

///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NewAnalysis {
    pub name: String,
    pub language: LanguageType,
    pub topic: String,
    pub tags: Vec<String>,
    pub scheduled: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnalysisPackage {
    pub id: String,
    pub metadata: AnalysisMetaData,
    pub code: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnalysisSummary {
    pub id: String,
    pub metadata: AnalysisMetaData,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnalysisSummaryWithSchedulerOrder {
    pub id: String,
    pub metadata: AnalysisMetaData,
    pub order: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnalysisMetaData {
    pub name: String,
    pub language: LanguageType,
    pub inputs: Vec<InputFile>,
    pub outputs: Vec<OutputFile>,
    pub topic: String,
    pub tags: Vec<String>,
    //
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "createdBy")]
    pub created_by: String,
    //
    #[serde(rename = "lastRunAt")]
    pub last_run_at: DateTime<Utc>,
    #[serde(rename = "lastRunBy")]
    pub last_run_by: String,
    //
    #[serde(rename = "lastModifiedAt")]
    pub last_modified_at: DateTime<Utc>,
    #[serde(rename = "lastModifiedBy")]
    pub last_modified_by: String,
    //
    pub scheduled: bool,
    #[serde(rename = "lastStatus")]
    pub last_status: StageResult,
}

impl AnalysisMetaData {
    pub fn new(
        name: &String,
        language: &LanguageType,
        topic: &String,
        tags: &Vec<String>,
        scheduled: bool,
        creator: &String,
    ) -> AnalysisMetaData {
        AnalysisMetaData {
            name: name.clone(),
            language: language.clone(),
            inputs: Vec::new(),
            outputs: Vec::new(),
            topic: topic.clone(),
            tags: tags.clone(),
            created_at: chrono::Utc::now(),
            created_by: creator.clone(),
            last_run_at: chrono::Utc::now(),
            last_run_by: "".to_string(),
            last_modified_at: chrono::Utc::now(),
            last_modified_by: "".to_string(),
            scheduled,
            last_status: StageResult::NA,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InputFile {
    #[serde(rename = "folderType")]
    pub folder_type: FolderType,
    #[serde(rename = "analysisId")]
    pub analysis_id: String,
    #[serde(rename = "fileName")]
    pub file_name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OutputFile {
    #[serde(rename = "fileName")]
    pub file_name: String,
    pub public: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DataFile {
    #[serde(rename = "fileName")]
    pub file_name: String,
    pub date: String,
    pub size: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CheckFileResponse {
    pub exists: bool,
    pub date: String,
    pub size: u64,
    pub public: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RealTimeMessage {
    #[serde(rename = "msgType")]
    pub msg_type: MessageType,
    pub stage: Option<Stage>,
    #[serde(rename = "stageResult")]
    pub stage_result: Option<StageResult>,
    pub log: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum MessageType {
    Heartbeat,
    Waiting,
    Stage,
    LogOut,
    LogErr,
    EndSuccess,
    EndFailure,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum Stage {
    InitializeAnalysis,
    ImportInputFiles,
    CleanRun,
    OutputFiles,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum StageResult {
    NA,
    Pending,
    Success,
    Failure,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Topic {
    pub id: String,
    pub label: String,
}
