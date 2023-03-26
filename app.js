const biba = require("./biba");
const path = require("path");
const ejs = require("ejs");
const fs = require("fs");
const app = biba();
const port = process.env.PORT || 5000;

const myRender = async (path = "", data = {}) => {
  try {
    const html = await ejs.renderFile(path, data);
    return html;
  } catch (err) {
    return err;
  }
};

const renderPage = async (
  path = "",
  data = { title: "", cssFile: "", jsFile: "" },
  res
) => {
  let html = await myRender(path, data);
  if (html instanceof Error) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.write(html.message);
    res.end();
  } else {
    html = await myRender("./templates/base.ejs", {
      title: data.title,
      body: html,
      cssFile: data.cssFile,
      jsFile: data.jsFile,
    });
    if (html instanceof Error) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.write(html.message);
      res.end();
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(html);
      res.end();
    }
  }
};

const dataParser = (data) => {
  let myObj = {};
  data = new URLSearchParams(data);
  for (let x of data.entries()) {
    myObj[x[0]] = x[1];
  }
  return myObj;
};

const getTasks = () => {
  const data = JSON.parse(fs.readFileSync("./db/data.json", "utf8"));
  return data;
};

const createTask = (message = "", req, res) => {
  const data = JSON.parse(fs.readFileSync("./db/data.json", "utf8"));
  data.push({ id: data.length + 1, message, isDone: false });
  fs.writeFileSync("./db/data.json", JSON.stringify(data));
  res.writeHead(302, { Location: req.headers.origin });
  res.end();
};

const deleteTask = (id, req, res) => {
  let data = JSON.parse(fs.readFileSync("./db/data.json", "utf8"));
  data = data.filter((t) => t.id != id);
  fs.writeFileSync("./db/data.json", JSON.stringify(data));
  res.writeHead(302, { Location: "/" });
  res.end();
};

const editTask = (message, isDone, req, res) => {
  let data = JSON.parse(fs.readFileSync("./db/data.json", "utf8"));
  let index = undefined;
  data.find((t, i) => {
    index = i;
    return t.id == req.params.id;
  });
  data[index] = {
    id: data[index].id,
    message,
    isDone: isDone == "true" ? true : false,
  };
  fs.writeFileSync("./db/data.json", JSON.stringify(data));
  res.writeHead(302, { Location: "/" });
  res.end();
};

app.static("/static/", path.join(__dirname, "static"));

app.get("/", (req, res) => {
  const tasks = getTasks();
  let data = {
    title: "Home",
    cssFile: "/static/css/home.css",
    tasks,
    jsFile: "/static/js/home.js",
  };
  renderPage("./templates/home.ejs", data, res);
});

app.get("/add", (req, res) => {
  let data = { title: "Add New Task", cssFile: "/static/css/add.css" };
  renderPage("./templates/add.ejs", data, res);
});

app.post("/add", (req, res) => {
  let data = "";
  req.on("data", (chunk) => {
    data += chunk.toString();
  });
  req.on("end", () => {
    let { message } = dataParser(data);
    createTask(message, req, res);
  });
});

app.get("/delete/:id", (req, res) => {
  deleteTask(req.params.id, req, res);
});

app.get("/edit/:id", (req, res) => {
  let data = JSON.parse(fs.readFileSync("./db/data.json", "utf8"));
  data = data.find((t) => t.id == req.params.id);
  data = { title: "Edit Task", cssFile: "/static/css/edit.css", task: data };
  renderPage("./templates/edit.ejs", data, res);
});

app.post("/edit/:id", (req, res) => {
  let data = "";
  req.on("data", (chunk) => {
    data += chunk.toString();
  });
  req.on("end", () => {
    let { message, isDone } = dataParser(data);
    editTask(message, isDone, req, res);
  });
});

app.listen(port, (err) => {
  if (err) {
    console.log(err.message);
    return;
  }
  console.log("Server listening on port " + port);
});
