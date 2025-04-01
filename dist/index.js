"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./server"));
const dotenv_1 = __importDefault(require("dotenv"));
require("./utils/Tasks/Schedule1");
require("./utils/Tasks/Schedule2");
dotenv_1.default.config();
const PORT = process.env.PORT || 4000;
server_1.default.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
