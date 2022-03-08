import { ObjectID } from "bson";
import express, { Request, response, Response } from "express";
import * as core from "express-serve-static-core";
import { appendFile } from "fs";
import { Db, MongoClient } from "mongodb";
import nunjucks from "nunjucks";
import cookie from "cookie"
import jose from "jose";

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

  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const redirectUri = process.env.AUTH0_REDIRECTURI;

  app.get("/login", (req, resp) => {
    resp.redirect(
      `${domain}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`
    );
  });

  app.get("/authorize", (req, resp) => {
    resp.render("index");
  });

  app.get("/userinfo", (req, resp) => {
    resp.redirect(`${domain}/userinfo Authorization: 'Bearer {ACCESS_TOKEN}'`);
  });

  app.get("/logout", (req, resp) => {
    resp.redirect(
      `${domain}/v2/logout?client_id=${clientId}&returnTo=http://localhost:3000`
    );
  });


  // Find your JSON Web Key Set in Advanced Settings → Endpoints
const jwksUrl = process.env.AUTH0_JSON_WEB_KEY_SET;



app.get("/callback", async (request: Request, response: Response) => {



  // Retrieve your tokens from Auth0 `/oauth/token` endpoint

  const jwksKeys = createRemoteJWKSet(jwksUrl);

  await jose.jwtVerify(<YOUR_ACCESS_TOKEN>, jwksKeys);
  await jose.jwtVerify(<YOUR_ID_TOKEN>, jwksKeys);

  response.setHeader(
    "Set-Cookie",
    cookie.serialize("token", <YOUR_ACCESS_TOKEN>, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      maxAge: 60 * 60,
      sameSite: "strict",
      path: "/",
    })
  );
})

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

  app.get("/game/:slug", (req, res) => {
    const slug = req.params.slug;

    client.connect().then(async (client)=> {
      const db = client.db();
      async function findGame(){
        const game = await db.collection<Game>("games").findOne({slug: slug});
        console.log(game)
        return game;
      }
      const gameInfo = await findGame();
      console.log(gameInfo);
      res.render("game", {game: gameInfo})
    })
  })

  return app;

}




