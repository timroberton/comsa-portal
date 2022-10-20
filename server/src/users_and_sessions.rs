use super::*;

///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UserFull {
    name: String,
    email: String,
    #[serde(rename = "hashedPassword")]
    hashed_password: String,
    #[serde(rename = "isAdmin")]
    is_admin: bool,
    #[serde(rename = "canEdit")]
    can_edit: bool,
}

impl UserFull {
    pub fn only_roles(&self) -> UserWithRoles {
        UserWithRoles {
            name: self.name.clone(),
            email: self.email.clone(),
            is_admin: self.is_admin,
            can_edit: self.can_edit,
        }
    }
}

#[derive(Debug)]
pub enum LoginError {
    NoSessionIdCookieOnRequest,
    BadSessionIdCookie,
    NoExistingSessionForUser,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UserWithRoles {
    pub name: String,
    pub email: String,
    #[serde(rename = "isAdmin")]
    is_admin: bool,
    #[serde(rename = "canEdit")]
    pub can_edit: bool,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for UserWithRoles {
    type Error = LoginError;

    async fn from_request(
        request: &'r Request<'_>,
    ) -> request::Outcome<UserWithRoles, Self::Error> {
        let session_id_cookie = match request.cookies().get_private("session_id") {
            Some(v) => v,
            None => return get_login_failure(LoginError::NoSessionIdCookieOnRequest),
        };
        let session_id_str = session_id_cookie.value();
        let session_id = match uuid::Uuid::parse_str(session_id_str) {
            Ok(v) => v,
            Err(_) => return get_login_failure(LoginError::BadSessionIdCookie),
        };
        let tsm = request
            .rocket()
            .state::<users_and_sessions::TimSessionsMap>()
            .expect("Should be able to get state");
        let sessions_map = tsm.sessions_map.lock().expect("Should unlock");
        let user = match sessions_map.retrieve_user_from_session_id(&session_id) {
            Some(v) => v,
            None => return get_login_failure(LoginError::NoExistingSessionForUser),
        };
        request::Outcome::Success(user.clone())
    }
}

fn get_login_failure(le: LoginError) -> request::Outcome<UserWithRoles, LoginError> {
    request::Outcome::Failure((rocket::http::Status::Unauthorized, le))
}

///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////

#[derive(Clone)]
pub struct TimSessionsMap {
    pub sessions_map: Arc<Mutex<SessionsMap>>,
}

impl TimSessionsMap {
    pub fn new_instance() -> TimSessionsMap {
        TimSessionsMap {
            sessions_map: Arc::new(Mutex::new(SessionsMap {
                sessions: HashMap::new(),
            })),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SessionsMap {
    pub sessions: HashMap<uuid::Uuid, UserWithRoles>,
}

impl SessionsMap {
    pub fn add_session_for_user(&mut self, user: UserWithRoles) -> uuid::Uuid {
        let mut session_id = uuid::Uuid::new_v4();
        while self.sessions.contains_key(&session_id) {
            session_id = uuid::Uuid::new_v4();
        }
        let _old_value = self.sessions.insert(session_id, user);
        session_id
    }
    pub fn change_user_roles(&mut self, email: String, is_admin: bool, can_edit: bool) {
        for v in self.sessions.iter_mut() {
            if v.1.email == email {
                v.1.is_admin = is_admin;
                v.1.can_edit = can_edit;
            }
        }
    }
    pub fn retrieve_user_from_session_id(&self, session_id: &uuid::Uuid) -> Option<&UserWithRoles> {
        self.sessions.get(session_id)
    }
    pub fn remove_session(&mut self, session_id: &uuid::Uuid) -> Option<()> {
        match self.sessions.remove(&session_id) {
            Some(_v) => Some(()),
            None => None,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NewUserRequest {
    pub email: String,
    pub password: String,
    pub name: String,
    #[serde(rename = "isAdmin")]
    is_admin: bool,
    #[serde(rename = "canEdit")]
    pub can_edit: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DeleteUserRequest {
    pub email: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LoginReturn {
    pub user: UserWithRoles,
}

///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////

#[get("/all_users")]
fn all_users(user: UserWithRoles) -> Json<Vec<UserWithRoles>> {
    if !user.is_admin {
        return Json(Vec::new());
    }
    let users = get_users().unwrap_or(Vec::new());
    let users_with_roles: Vec<UserWithRoles> = users.iter().map(|x| x.only_roles()).collect();
    Json(users_with_roles)
}

#[post("/reset_password", format = "application/json", data = "<lr>")]
fn reset_password(user: UserWithRoles, lr: Json<LoginRequest>) -> Option<()> {
    let email = lr.email.clone();
    if !user.is_admin && user.email != email {
        return None;
    }
    let new_password = lr.password.clone();
    let hashed_password = hash(new_password, DEFAULT_COST).ok()?;
    let mut users = get_users()?;
    let user = users.iter_mut().find(|x| x.email == email)?;
    user.hashed_password = hashed_password;
    save_new_users(users)?;
    Some(())
}

#[post("/new_user", format = "application/json", data = "<nur>")]
fn new_user(user: UserWithRoles, nur: Json<NewUserRequest>) -> Option<()> {
    if !user.is_admin {
        return None;
    }
    let new_user = nur.into_inner();
    let hashed_password = hash(new_user.password.clone(), DEFAULT_COST).ok()?;
    let mut users = get_users()?;
    if users.iter().any(|x| x.email == new_user.email) {
        return None;
    }
    let new_user_full = UserFull {
        name: new_user.name,
        email: new_user.email,
        hashed_password,
        is_admin: new_user.is_admin,
        can_edit: new_user.can_edit,
    };
    users.push(new_user_full);
    save_new_users(users)?;
    Some(())
}

#[post("/update_user", format = "application/json", data = "<uwr>")]
fn update_user(
    user: UserWithRoles,
    uwr: Json<UserWithRoles>,
    tsm: &State<TimSessionsMap>,
) -> Option<()> {
    let new_user = uwr.into_inner();
    if !user.is_admin && user.email != new_user.email {
        return None;
    }
    let mut users = get_users()?;
    let user = users.iter_mut().find(|x| x.email == new_user.email)?;
    user.name = new_user.name;
    user.is_admin = new_user.is_admin;
    user.can_edit = new_user.can_edit;
    save_new_users(users)?;
    // Update session map with new roles
    let mut sessions_map = tsm.sessions_map.lock().ok()?;
    sessions_map.change_user_roles(new_user.email, new_user.is_admin, new_user.can_edit);
    Some(())
}

#[post("/delete_user", format = "application/json", data = "<dur>")]
fn delete_user(user: UserWithRoles, dur: Json<DeleteUserRequest>) -> Option<()> {
    if !user.is_admin {
        return None;
    }
    let user_to_delete = dur.into_inner();
    let mut users = get_users()?;
    users.retain(|x| x.email != user_to_delete.email);
    save_new_users(users)?;
    Some(())
}

// #[post(
//     "/update_users",
//     format = "application/json",
//     data = "<new_users_json>"
// )]
// fn update_users(_user: UserWithRoles, new_users_json: Json<Vec<UserWithRoles>>) -> Json<u8> {
//     let new_users = new_users_json.into_inner();
//     save_new_users(new_users);
//     Json(1)
// }

#[get("/user")]
fn user(user: UserWithRoles) -> Json<UserWithRoles> {
    Json(user)
}

#[post("/login", format = "application/json", data = "<lr>")]
fn login(
    jar: &CookieJar<'_>,
    tsm: &State<TimSessionsMap>,
    lr: Json<LoginRequest>,
) -> Option<Json<LoginReturn>> {
    let email = lr.email.clone();
    let password_attempt = lr.password.clone();
    let users = get_users()?;
    let user = users.iter().find(|x| x.email == email)?;

    let password_is_valid = verify(password_attempt, &user.hashed_password).ok()?;
    if !password_is_valid {
        return None;
    }

    let user_for_session = user.only_roles();
    let user_for_client = user.only_roles();
    let mut sessions_map = tsm.sessions_map.lock().ok()?;
    let session_id = sessions_map.add_session_for_user(user_for_session);
    let mut c = Cookie::new("session_id", session_id.to_string());
    //
    // Change this if you want it to work on HTTP as well as HTTPS
    c.set_secure(true);
    //
    // Change this to ::None if using an API model
    c.set_same_site(SameSite::Strict);
    //
    jar.add_private(c);
    Some(Json(LoginReturn {
        user: user_for_client,
    }))
}

#[get("/logout")]
fn logout(jar: &CookieJar<'_>, tsm: &State<TimSessionsMap>) -> Option<()> {
    let session_id_cookie = jar.get_private("session_id")?;
    let session_id_str = session_id_cookie.value();
    let session_id = uuid::Uuid::parse_str(session_id_str).ok()?;
    let mut sessions_map = tsm.sessions_map.lock().unwrap();
    sessions_map.remove_session(&session_id);
    jar.remove_private(Cookie::named("session_id"));
    Some(())
}

pub fn user_routes() -> Vec<rocket::Route> {
    routes![
        all_users,
        reset_password,
        new_user,
        update_user,
        delete_user,
        user,
        login,
        logout
    ]
}
