import "dotenv/config";
import { MongoClient } from "mongodb";

let databaseUrl = process.env.MONGO_URL || "";

if (process.env.HEROKU_APP_NAME) {
  const url = new URL(databaseUrl);
  const herokuAppNameParts = process.env.HEROKU_APP_NAME.split("-");
  url.pathname = `${
    herokuAppNameParts[herokuAppNameParts.length - 1]
  }-${url.pathname.slice(1)}`;
  databaseUrl = url.toString();
}

export function initDB(): Promise<MongoClient> {
  const client = new MongoClient(databaseUrl);
  return client.connect();
  // return MongoClient.connect(databaseUrl);
}
