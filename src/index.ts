import server from "./server";
import dotenv from "dotenv";
import "./utils/Tasks/Schedule1"
import "./utils/Tasks/Schedule2"

dotenv.config();

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
