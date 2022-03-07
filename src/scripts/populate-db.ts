import "dotenv/config";
import { MongoClient } from "mongodb";
import games from "./games.json";

let databaseUrl = process.env.MONGO_URL || "";

if (process.env.HEROKU_APP_NAME) {
  const url = new URL(databaseUrl);
  const herokuAppNameParts = process.env.HEROKU_APP_NAME.split("-");
  url.pathname = `${
    herokuAppNameParts[herokuAppNameParts.length - 1]
  }-${url.pathname.slice(1)}`;
  databaseUrl = url.toString();
}

const client = new MongoClient(databaseUrl);
client.connect().then(async (client) => {
  try {
    await client.db().collection("games").drop();
  } catch {
    console.log("No games collection found, creating one...");
  }
  await client.db().collection("games").insertMany(games);
  client.close();
  console.log("Database populated");
});
