import "dotenv/config";
import { makeApp } from "./src/server";
import { initDB } from "./src/init-database";

initDB().then((client) => {
  const db = client.db();
  const app = makeApp(db);

  app.listen(process.env.PORT, () => {
    console.log(`Server started on http://localhost:${process.env.PORT}`);
  });
});
