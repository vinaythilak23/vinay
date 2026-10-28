import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, allowRoles } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const includeDetails = {
  reporter: { select: { id: true, fullName: true } },
  assignedResponder: { select: { id: true, fullName: true, phone: true } }
};

router.get("/", async (req, res) => {
  try {
    const where = {};
    if (req.user.role === "CITIZEN") where.reporterId = req.user.id;
    if (req.user.role === "RESPONDER") {
      // Responders see open incidents and incidents assigned to themselves.
      where.OR = [
        { status: "OPEN" },
        { assignedResponderId: req.user.id }
      ];
    }
    const incidents = await prisma.incident.findMany({
      where,
      include: includeDetails,
      orderBy: [{ severity: "desc" }, { createdAt: "asc" }],
      take: 200
    });
    res.json({ incidents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load incidents." });
  }
});

router.post("/", allowRoles("CITIZEN", "ADMIN"), async (req, res) => {
  try {
    const { title, category, description, severity, latitude, longitude, locationText } = req.body;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!title?.trim() || !category || !description?.trim()) {
      return res.status(400).json({ message: "Title, category, and description are required." });
    }
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ message: "Enter valid latitude and longitude coordinates." });
    }
    const allowedSeverity = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const incident = await prisma.incident.create({
      data: {
        title: title.trim(),
        category,
        description: description.trim(),
        severity: allowedSeverity.includes(severity) ? severity : "MEDIUM",
        latitude: lat,
        longitude: lng,
        locationText: locationText?.trim() || null,
        reporterId: req.user.id
      },
      include: includeDetails
    });
    res.status(201).json({ incident });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not submit incident." });
  }
});

router.post("/:id/accept", allowRoles("RESPONDER", "ADMIN"), async (req, res) => {
  try {
    // Conditional update prevents two responders from claiming the same open incident.
    const result = await prisma.incident.updateMany({
      where: { id: req.params.id, status: "OPEN", assignedResponderId: null },
      data: {
        status: "ACCEPTED",
        assignedResponderId: req.user.id,
        acceptedAt: new Date()
      }
    });
    if (result.count === 0) {
      return res.status(409).json({ message: "This incident has already been claimed or is no longer open." });
    }
    const incident = await prisma.incident.findUnique({ where: { id: req.params.id }, include: includeDetails });
    res.json({ incident });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not accept incident." });
  }
});

router.patch("/:id/status", allowRoles("RESPONDER", "ADMIN"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["EN_ROUTE", "ON_SCENE", "RESOLVED"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status." });

    const current = await prisma.incident.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ message: "Incident not found." });
    if (req.user.role !== "ADMIN" && current.assignedResponderId !== req.user.id) {
      return res.status(403).json({ message: "Only the assigned responder can update this incident." });
    }
    const data = { status };
    if (status === "ON_SCENE") data.arrivedAt = new Date();
    if (status === "RESOLVED") data.resolvedAt = new Date();

    const incident = await prisma.incident.update({
      where: { id: req.params.id },
      data,
      include: includeDetails
    });
    res.json({ incident });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not update incident status." });
  }
});

router.patch("/availability", allowRoles("RESPONDER"), async (req, res) => {
  try {
    const { available } = req.body;
    if (typeof available !== "boolean") return res.status(400).json({ message: "available must be true or false." });
    // Store responder availability on the user's profile.
    await prisma.user.update({ where: { id: req.user.id }, data: { availability: available } });
    res.json({ availability: available });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not update availability." });
  }
});

export default router;
