import { ObjectID } from "bson";
import express, { Request, Response } from "express";
import * as core from "express-serve-static-core";
import { Db, MongoClient } from "mongodb";
import nunjucks from "nunjucks";

const databaseUrl = process.env.MONGO_URL || "";
const client = new MongoClient(databaseUrl);

type Game = {
  _id: ObjectID;
  name: string;
  platform: string[];
  slug: string;
  summary: string;
  url: string;
};

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
    client.connect().then(async (client) => {
      const db = client.db();
      async function findAllGames(): Promise<Game[]> {
        const games = await db.collection<Game>("games").find().toArray();
        return games;
      }
      const gamesInfos = await findAllGames();
      response.render("games", { games: gamesInfos });
    });
  });
  return app;
}
