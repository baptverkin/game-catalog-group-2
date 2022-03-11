import { ObjectID } from "bson";
import express, { Request, response, Response } from "express";
import * as core from "express-serve-static-core";
import { appendFile } from "fs";
import { Db, MongoClient } from "mongodb";
import nunjucks from "nunjucks";
import cookie from "cookie";
import slugify from "slugify";
import { platform } from "os";
import fetch from "node-fetch";
import { resourceLimits } from "worker_threads";
// import jose from "jose";

const databaseUrl = process.env.MONGO_URL || "";
const client = new MongoClient(databaseUrl);

type Game = {
  _id: ObjectID;
  name: string;
  platform: Platform;
  slug: string;
  summary: string;
  url: string;
};

type Platform = {
  name: string;
  platform_logo_url: string;
  url: string;
};

export function makeApp(db: Db): core.Express {
  const app = express();

  nunjucks.configure("views", {
    autoescape: true,
    express: app,
  });

  const domainAuth0 = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const redirectUri = process.env.AUTH0_REDIRECTURI;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const audience = process.env.AUTH0_AUDIENCE;
  const scope = process.env.AUTH0_SCOPES;
  const token = process.env.AUTH0_TOKEN_URL;
  const domain = process.env.DOMAIN;

  app.get("/login", (req, resp) => {
    resp.redirect(
      `${domainAuth0}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&audience=${audience}&scope=${scope}`
    );
  });

  app.get("/authorize", async (req, resp) => {
    const authCode = req.query.code;

    const userInfo = await fetch(`${token}`, {
      method: "POST",
      headers: { "Content-type": "application/x-www-form-urlencoded" },
      body: `grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${authCode}&redirect_uri=${redirectUri}`,
    }).then((result) => result.json());

    const idToken = userInfo.id_token;
    const accessToken = userInfo.access_token;

    db.collection("users").insertOne({
      id_token: idToken,
      access_token: accessToken,
    });

    resp.set(
      "Set-Cookie",
      cookie.serialize("idCookie", idToken, {
        maxAge: 3600, // This is the time (in seconds) that this cookie will be stored
      })
    );

    resp.render("index");
  });

  app.get("/userinfo", (req, resp) => {
    resp.redirect(`${domainAuth0}/userinfo`);
  });

  app.get("/logout", (req, resp) => {
    resp.set("Set-Cookie", [
      cookie.serialize("idCookie", "", {
        maxAge: 0,
      }),
      cookie.serialize("myCookie", "", {
        maxAge: 0,
      }),
    ]);
    resp.redirect(
      `${domainAuth0}/v2/logout?client_id=${clientId}&returnTo=${domain}`
    );
  });

  app.get("/basket", async (req, resp) => {
    const mycookie = cookie.parse(req.get("cookie") || "");
    const user = mycookie.idCookie;

        type Token ={
          id_token: string,
          access_token: string,
        }
      const token = await db.collection<Token>("users").findOne({ id_token: user })
      .then((result)=> result?.id_token);


    if (user === undefined) {
      resp.redirect("/pleaseLogin");
    }else if (user === token) {
      const cart = await db.collection("basket").find({user: user}).toArray();
      resp.render("basket", { game: cart });
    } else {
      console.error()
    }
  });

  const formParser = express.urlencoded({ extended: true });

  app.post("/add-cookie/:slug", formParser, (request, response) => {
    const routeParameters = request.params.slug;
    const mycookie = cookie.parse(request.get("cookie") || "");
    const user = mycookie.idCookie;

    client.connect().then(async (client) => {
      const db = client.db();

      const game = await db
        .collection<Game>("games")
        .findOne({ slug: routeParameters });

        type Token ={
          id_token: string,
          access_token: string,
        }
      const token = await db.collection<Token>("users").findOne({ id_token: user })
      .then((result)=> result?.id_token);

      response.set(
        "Set-Cookie",
        cookie.serialize("myCookie", routeParameters, {
          maxAge: 3600, // This is the time (in seconds) that this cookie will be stored
        })
      );

      if ( user === undefined) {
        response.redirect("/pleaseLogin");
      } else if (user === token) {
        db.collection("basket").insertOne({ game: game, user: token });
        response.render("confirm", { game });
      } else {
        console.error()
      }
    });
  });

  app.get("/pleaseLogin", (req, resp) => {
    resp.render("pleaseLogin")
  })

  // CLEAR BASKET
  app.post("/clear-db", (request, response) => {
    db.collection("basket").drop();
    db.createCollection("basket");

    response.render("basket");
  });

  app.use(express.static("public"));

  app.set("view engine", "njk");

  app.get("/", (request: Request, response: Response) => {
    response.render("index");
  });

  app.get("/platforms", (request, response) => {
    client.connect().then(async (client) => {
      const db = client.db();

      async function findAllPlatforms() {
        const games: Game[] = await db
          .collection<Game>("games")
          .find()
          .toArray();

        const arr: Platform[] = games
          .map((e) => e.platform)
          .filter((e) => e !== undefined);

        const platforms: Platform[] = arr.reduce(
          (acc, current) => {
            const x = acc.find((item) => item.name === current.name);
            if (!x) {
              return acc.concat([current]);
            } else {
              return acc;
            }
          },
          [arr[0]]
        );
        return platforms;
      }
      const platformsInfos = await findAllPlatforms();
      response.render("platforms", { platformsInfos });
    });
  });

  app.get("/platform/:name", (req, res) => {
    const nameSlug = req.params.name;
    const name = nameSlug.replace("-", " ");

    console.log(126, name);

    client.connect().then(async (client) => {
      const db = client.db();
      async function findGames() {
        const games = await db
          .collection<Game>("games")
          .find({ "platform.name": name })
          .toArray();
        // console.log(games);
        return games;
      }
      const platformGames = await findGames();
      // console.log(platformGames);
      res.render("platformGames", { platformGames });
    });
  });

  app.get("/games", (request, response) => {
    const pageNumber = parseInt(String(request.query.page));
    console.log(pageNumber);

    client.connect().then(async (client) => {
      const db = client.db();
      async function findAllGames(): Promise<Game[]> {
        const games = await db
          .collection<Game>("games")
          .find()
          .skip((pageNumber - 1) * 10)
          .limit(10)
          .toArray();
        return games;
      }
      const gamesInfos = await findAllGames();

      response.render("games", { games: gamesInfos, pageNumber });
    });
  });

  app.get("/game/:slug", (req, res) => {
    const slug = req.params.slug;

    client.connect().then(async (client) => {
      const db = client.db();
      async function findGame() {
        const game = await db.collection<Game>("games").findOne({ slug: slug });
        //console.log(game);
        return game;
      }
      const gameInfo = await findGame();
      //console.log(gameInfo);
      res.render("game", { game: gameInfo });
    });
  });

  return app;
}
