export function getUserKey(req) {
    return (req.headers["x-forwarded-for"] || req.socket.remoteAddress) + req.headers["user-agent"];
}
