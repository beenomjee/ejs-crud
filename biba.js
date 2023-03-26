const http = require("http");
const fs = require("fs");
const path = require("path");
class Biba {
  constructor() {
    this.routes = [];
  }
  listen(port, cb) {
    let f1 = ((req, res) => {
      this.server(req, res);
    }).bind(this);
    http.createServer(f1).listen(port, cb);
  }

  server(req, res) {
    console.log("Requested at " + req.method + " : " + req.url);
    // checking static route availability
    const staticRequestedRoute = this.routes.find((r) => r.method === "static");
    if (
      staticRequestedRoute &&
      this.isStaticRouteMatch(req.url, staticRequestedRoute.route)
    ) {
      const filePath = path.join(
        staticRequestedRoute.path,
        req.url.slice(staticRequestedRoute.route.length)
      );

      try {
        let data = fs.readFileSync(filePath, "utf8");
        res.writeHead(200);
        res.write(data);
        res.end();
      } catch (err) {
        res.writeHead(404);
        res.write(err.message);
        res.end();
      }
      return;
    }
    // checking route available
    const currentRequestedRoute = this.routes.find(
      (r) =>
        this.isUrlMatch(req.url, r.route) &&
        req.method.toLowerCase() === r.method
    );

    if (currentRequestedRoute) {
      this.getUrlParams(req, req.url, currentRequestedRoute.route);
      currentRequestedRoute.cb(req, res);
    }
  }

  get(route, cb) {
    this.routes.push({ method: "get", route, cb });
  }
  post(route, cb) {
    this.routes.push({ method: "post", route, cb });
  }
  put(route, cb) {
    this.routes.push({ method: "put", route, cb });
  }
  delete(route, cb) {
    this.routes.push({ method: "delete", route, cb });
  }
  all(route, cb) {
    this.routes.push({ method: "all", route, cb });
  }
  static(route, path) {
    this.routes.push({ method: "static", route, path });
  }
  // url parameters
  isUrlMatch(reqUrl = "", yourUrl = "") {
    reqUrl = reqUrl.split("/");
    yourUrl = yourUrl.split("/");
    if (reqUrl.length != yourUrl.length) return false;
    for (let i = 0; i < yourUrl.length; i++) {
      if (yourUrl[i].startsWith(":")) continue;
      else if (reqUrl[i] != yourUrl[i]) return false;
    }
    return true;
  }
  //   url parameters parser
  getUrlParams(req, reqUrl = "", yourUrl = "") {
    reqUrl = reqUrl.split("/");
    yourUrl = yourUrl.split("/");
    if (reqUrl.length != yourUrl.length) return false;
    req.params = {};
    for (let i = 0; i < yourUrl.length; i++) {
      if (yourUrl[i].startsWith(":")) {
        req.params[yourUrl[i].slice(1)] = reqUrl[i];
      }
    }
  }
  //   static route matcher
  isStaticRouteMatch(reqUrl, staticUrl) {
    return reqUrl.slice(0, staticUrl.length) === staticUrl;
  }
}
const biba = () => new Biba();
module.exports = biba;
