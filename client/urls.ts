export const _HOST = process.env.NODE_ENV === "development"
    // ? "http://localhost:9700/api"
    ? "http://localhost:9000/api"
    : "/api";

// Because the server has SameSite::Strict for cookies, need to have this be the same host as server