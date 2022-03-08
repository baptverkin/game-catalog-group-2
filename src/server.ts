import express, { Request, Response } from "express";
import * as core from "express-serve-static-core";
import { Db } from "mongodb";
import nunjucks from "nunjucks";

export function makeApp(db: Db): core.Express {
  const app = express();

  nunjucks.configure("views", {
    autoescape: true,
    express: app,
  });

const domain = process.env.AUTH0_DOMAIN;
const clientId = process.env.AUTH0_CLIENT_ID;
const redirectUri = process.env.AUTH0_REDIRECTURI;

app.get("/login", (req, res) => {
  res.redirect(`${domain}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`)
});

  app.use(express.static("public"));

  app.set("view engine", "njk");

  app.get("/", (request: Request, response: Response) => {
    response.render("index");
  });

  app.get("/platforms", (request, response) => {
    response.render("platforms");
  });

  app.get("/games", (request, response) => {
    response.render("games");
  });
  return app;
}
