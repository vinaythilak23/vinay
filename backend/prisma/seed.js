import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("Admin@1234", 12);
  const responderHash = await bcrypt.hash("Responder@1234", 12);
  const citizenHash = await bcrypt.hash("Citizen@1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@resqnow.org" },
    update: {},
    create: {
      fullName: "System Admin",
      email: "admin@resqnow.org",
      passwordHash: adminHash,
      role: "ADMIN",
      phone: "+1-800-555-0199"
    }
  });

  const responder = await prisma.user.upsert({
    where: { email: "responder@resqnow.org" },
    update: {},
    create: {
      fullName: "Alex Miller (EMT)",
      email: "responder@resqnow.org",
      passwordHash: responderHash,
      role: "RESPONDER",
      availability: true,
      phone: "+1-800-555-0144"
    }
  });

  const citizen = await prisma.user.upsert({
    where: { email: "citizen@resqnow.org" },
    update: {},
    create: {
      fullName: "Sarah Jenkins",
      email: "citizen@resqnow.org",
      passwordHash: citizenHash,
      role: "CITIZEN",
      phone: "+1-800-555-0112"
    }
  });

  const existingIncidents = await prisma.incident.count();
  if (existingIncidents === 0) {
    await prisma.incident.createMany({
      data: [
        {
          title: "Multi-vehicle collision on Expressway",
          category: "Traffic",
          description: "Two sedans involved in rear-end collision. Minor injuries reported, traffic backed up.",
          severity: "HIGH",
          status: "OPEN",
          latitude: 37.7749,
          longitude: -122.4194,
          locationText: "Highway 101 Northbound near Exit 432",
          reporterId: citizen.id
        },
        {
          title: "Commercial Kitchen Grease Fire",
          category: "Fire",
          description: "Small grease fire reported behind restaurant grill, extinguisher deployed, smoke ventilation needed.",
          severity: "CRITICAL",
          status: "ACCEPTED",
          latitude: 37.7833,
          longitude: -122.4167,
          locationText: "450 Market St, Financial District",
          reporterId: citizen.id,
          assignedResponderId: responder.id,
          acceptedAt: new Date()
        },
        {
          title: "Elderly resident fall with wrist injury",
          category: "Medical",
          description: "Patient conscious and alert, difficulty standing, requesting paramedic assistance.",
          severity: "MEDIUM",
          status: "OPEN",
          latitude: 37.7690,
          longitude: -122.4467,
          locationText: "1290 Haight St",
          reporterId: citizen.id
        }
      ]
    });
  }

  console.log("Database seeded successfully with demo accounts and incidents.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
