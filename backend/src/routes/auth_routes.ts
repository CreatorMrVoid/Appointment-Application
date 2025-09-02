import { Router } from "express";
import { validate } from "../middlewares/validate";
import { register, login, refresh, me } from "../controllers/auth_controller";
import { loginSchema, registerSchema } from "../schemas/auth_schema";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login",    validate(loginSchema),    login);
router.post("/refresh",  refresh);
router.get("/me", requireAuth, me);

export default router;
