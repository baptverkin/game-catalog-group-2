import { MongoClient } from "mongodb";
import "dotenv/config";

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
client.connect().then(async (client: MongoClient) => {
  await client.db().dropDatabase();
  client.close();
  console.log("Database dropped");
});
