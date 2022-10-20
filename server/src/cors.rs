use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::{Header, Method, Status};
use rocket::{Request, Response};
use std::io::Cursor;
pub struct CORS();

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to requests",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        // Option 1 = dynamically let in from different origins
        // let origin = request.headers().get_one("Origin").unwrap_or("*");
        // TODO: check against list of approved origins
        // response.set_header(Header::new("Access-Control-Allow-Origin", origin));
        //
        //
        // Option 2 = same site
        if cfg!(debug_assertions) {
            response.set_header(Header::new(
                "Access-Control-Allow-Origin",
                "http://localhost:3000",
            ));
        } else {
            response.set_header(Header::new(
                "Access-Control-Allow-Origin",
                "https://comsa-portal.capacityapps.com",
            ));
        }

        response.set_header(Header::new(
            "Access-Control-Allow-Methods",
            "POST, GET, OPTIONS",
        ));
        response.set_header(Header::new("Access-Control-Allow-Headers", "content-type"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));

        if request.method() == Method::Options {
            response.set_sized_body(0, Cursor::new(""));
            response.set_status(Status::Accepted);
        }
    }
}
