import express from "express";
import {
    editMessage,
    deleteMessage,
    reactToMessage,
    markMessageSeen
  } from "../controllers/message.controller.js";
  
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.post("/send/:id", protectRoute, sendMessage);
router.put("/edit/:messageId", protectRoute, editMessage);
router.delete("/delete/:messageId", protectRoute, deleteMessage);
router.post("/react/:messageId", protectRoute, reactToMessage);
router.post("/seen/:messageId", protectRoute, markMessageSeen);


export default router;
