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
  platform: {
    name: string;
    platform_logo_url: string;
    url: string;
  };
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

  app.use(express.static("public"));

  app.set("view engine", "njk");

  app.get("/", (request: Request, response: Response) => {
    response.render("index");
  });

  app.get("/platforms", (request, response) => {
    client.connect().then(async (client) => {
      const db = client.db();
      async function findAllGames(): Promise<Game[]> {
        const games = await db.collection<Game>("games").find().toArray();
        return games;
      }
      const gamesInfos = await findAllGames();

      function getPlatformsNames() {
        const patate: string[] = [];
        gamesInfos.forEach((element) => {
          patate.push(element.platform.name);
        });
        const arr = new Set(patate);
        const tomate: string[] = [];
        arr.forEach(async (index) => {
          tomate.push(index);
        });

        return tomate;
      }
      const listOfPlatforms = getPlatformsNames();
      console.log(listOfPlatforms);

      response.render("platforms", { listOfPlatforms });
    });
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
