import { Router } from "express";
import { validate } from "../middlewares/validate";
import { register, login, refresh } from "../controllers/auth_controller";
import { loginSchema, registerSchema } from "../schemas/auth_schema";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login",    validate(loginSchema),    login);
router.post("/refresh",  refresh);

export default router;
