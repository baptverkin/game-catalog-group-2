import { openBrowser, goto, text, closeBrowser } from "taiko";
import { Server } from "http";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import { makeApp } from "../../src/server";

dotenv.config();

jest.setTimeout(50000);

let server: Server;
let mongoClient: MongoClient;
const databaseUrl: string = process.env.MONGO_URL || "";

beforeAll(async () => {
  await openBrowser({
    args: [
      "--window-size=1440,1000",
      "--no-sandbox",
      "--start-maximized",
      "--disable-dev-shm",
    ],
    headless: true,
    observe: false,
    observeTime: 2000,
  });
});

beforeEach(async () => {
  return await MongoClient.connect(databaseUrl).then(async (client) => {
    mongoClient = client;
    const db = mongoClient.db();

    server = makeApp(db).listen(3030);
  });
});

afterEach(async () => {
  await mongoClient.close();
  server.close();
});

afterAll(async () => {
  await closeBrowser();
});

test("Test that we have an index with an h1", async () => {
  expect.assertions(1);

  await goto("http://localhost:3030");

  expect(await text("This should be changed in the first PR").exists()).toBe(
    true
  );
});
