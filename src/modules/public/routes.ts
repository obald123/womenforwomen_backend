import { Router } from "express";
import { validate } from "../../middleware/validate";
import { subscribeSchema } from "../../validators/newsletter";
import {
  publicArticles,
  publicArticle,
  publicEvents,
  publicEvent,
  publicGallery,
  publicTeam,
  subscribe,
  verifySubscription,
} from "./controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { publicMessageRouter } from "../messages/routes";

const router = Router();

router.get("/articles", asyncHandler(publicArticles));
router.get("/articles/:slug", asyncHandler(publicArticle));
router.get("/events", asyncHandler(publicEvents));
router.get("/events/:slug", asyncHandler(publicEvent));
router.get("/gallery", asyncHandler(publicGallery));
router.get("/team", asyncHandler(publicTeam));
router.post("/subscribe", validate(subscribeSchema), asyncHandler(subscribe));
router.get("/verify-subscription", asyncHandler(verifySubscription));
router.use("/messages", publicMessageRouter);

export default router;
