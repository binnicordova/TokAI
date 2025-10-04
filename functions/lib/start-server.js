"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const server_1 = require("./server");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const server = (0, http_1.createServer)(app);
// Attach the TikTok handler
app.use('/tiktok', server_1.tiktokHandler);
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
