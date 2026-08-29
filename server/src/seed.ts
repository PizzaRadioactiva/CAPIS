import { PrismaClient, Role, Unit, MovementType } from "@prisma/client";
import { hashPassword } from "./lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Sembrando datos de demostración...");

  // --- Users ---
  const adminPassword = await hashPassword("Admin123!");
  const staffPassword = await hashPassword("Staff123!");

  const admin = await prisma.user.upsert({
    where: { email: "admin@caps.local" },
    update: {},
    create: {
      name: "Administrador CAPS",
      email: "admin@caps.local",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@caps.local" },
    update: {},
    create: {
      name: "Personal de Farmacia",
      email: "staff@caps.local",
      passwordHash: staffPassword,
      role: Role.STAFF,
    },
  });

  // --- Settings ---
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      orgName: "C.A.P.S.",
      orgSubtitle: "Centro de Atención Primaria de la Salud",
      capsEmail: process.env.CAPS_EMAIL || null,
    },
  });

  // --- Categories ---
  const categoryNames = [
    ["Analgésicos", "Medicamentos para el dolor"],
    ["Antibióticos", "Tratamiento de infecciones bacterianas"],
    ["Antihipertensivos", "Control de la presión arterial"],
    ["Antidiabéticos", "Control de glucosa en sangre"],
    ["Respiratorio", "Medicación para vías respiratorias"],
    ["Insumos Descartables", "Jeringas, guantes, gasas, etc."],
    ["Antisépticos", "Soluciones y productos de desinfección"],
    ["Material de Curación", "Vendas, gasas y apósitos"],
  ];

  const categories: Record<string, string> = {};
  for (const [name, description] of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, description },
    });
    categories[name] = cat.id;
  }

  const demoProducts = [
    {
      name: "Paracetamol 500mg",
      genericName: "Paracetamol",
      category: "Analgésicos",
      manufacturer: "Laboratorio Genérico SA",
      quantity: 200,
      minimumStock: 50,
      unit: Unit.UNIT,
      batchNumber: "LOT-2026-001",
      expirationDate: new Date("2027-06-30"),
      supplier: "Distribuidora Central",
    },
    {
      name: "Ibuprofeno 400mg",
      genericName: "Ibuprofeno",
      category: "Analgésicos",
      manufacturer: "Laboratorio Genérico SA",
      quantity: 8,
      minimumStock: 40,
      unit: Unit.UNIT,
      batchNumber: "LOT-2026-014",
      expirationDate: new Date("2026-11-15"),
      supplier: "Distribuidora Central",
    },
    {
      name: "Amoxicilina 500mg",
      genericName: "Amoxicilina",
      category: "Antibióticos",
      manufacturer: "Farmalab",
      quantity: 150,
      minimumStock: 30,
      unit: Unit.UNIT,
      batchNumber: "LOT-2026-022",
      expirationDate: new Date("2027-02-20"),
      supplier: "Droguería del Sur",
    },
    {
      name: "Salbutamol Aerosol 100mcg",
      genericName: "Salbutamol",
      category: "Respiratorio",
      manufacturer: "PharmaCorp",
      quantity: 0,
      minimumStock: 15,
      unit: Unit.UNIT,
      batchNumber: "LOT-2025-098",
      expirationDate: new Date("2026-09-30"),
      supplier: "Droguería del Sur",
    },
    {
      name: "Enalapril 10mg",
      genericName: "Enalapril",
      category: "Antihipertensivos",
      manufacturer: "Laboratorio Genérico SA",
      quantity: 60,
      minimumStock: 25,
      unit: Unit.UNIT,
      batchNumber: "LOT-2026-005",
      expirationDate: new Date("2027-08-01"),
      supplier: "Distribuidora Central",
    },
    {
      name: "Losartán 50mg",
      genericName: "Losartán potásico",
      category: "Antihipertensivos",
      manufacturer: "Farmalab",
      quantity: 12,
      minimumStock: 20,
      unit: Unit.UNIT,
      batchNumber: "LOT-2026-009",
      expirationDate: new Date("2026-10-10"),
      supplier: "Droguería del Sur",
    },
    {
      name: "Metformina 850mg",
      genericName: "Metformina",
      category: "Antidiabéticos",
      manufacturer: "PharmaCorp",
      quantity: 240,
      minimumStock: 60,
      unit: Unit.UNIT,
      batchNumber: "LOT-2026-011",
      expirationDate: new Date("2027-12-01"),
      supplier: "Distribuidora Central",
    },
    {
      name: "Insulina NPH",
      genericName: "Insulina NPH",
      category: "Antidiabéticos",
      manufacturer: "BioFarma",
      quantity: 6,
      minimumStock: 10,
      unit: Unit.VIAL,
      batchNumber: "LOT-2026-030",
      expirationDate: new Date("2026-09-18"),
      supplier: "Droguería del Sur",
    },
    {
      name: "Guantes de Examen (Talle M)",
      genericName: null,
      category: "Insumos Descartables",
      manufacturer: "MedSupply",
      quantity: 500,
      minimumStock: 100,
      unit: Unit.BOX,
      batchNumber: "LOT-2026-040",
      expirationDate: null,
      supplier: "Insumos Médicos SRL",
    },
    {
      name: "Jeringa Descartable 5cc",
      genericName: null,
      category: "Insumos Descartables",
      manufacturer: "MedSupply",
      quantity: 450,
      minimumStock: 150,
      unit: Unit.UNIT,
      batchNumber: "LOT-2026-041",
      expirationDate: null,
      supplier: "Insumos Médicos SRL",
    },
    {
      name: "Alcohol Etílico 70% x 500ml",
      genericName: null,
      category: "Antisépticos",
      manufacturer: "QuimLab",
      quantity: 40,
      minimumStock: 20,
      unit: Unit.BOTTLE,
      batchNumber: "LOT-2026-050",
      expirationDate: new Date("2028-01-01"),
      supplier: "Distribuidora Central",
    },
    {
      name: "Solución Fisiológica x 500ml",
      genericName: "Cloruro de sodio 0.9%",
      category: "Antisépticos",
      manufacturer: "BioFarma",
      quantity: 153,
      minimumStock: 50,
      unit: Unit.BOTTLE,
      batchNumber: "LOT-2026-051",
      expirationDate: new Date("2027-05-01"),
      supplier: "Droguería del Sur",
    },
    {
      name: "Venda de Gasa 10cm",
      genericName: null,
      category: "Material de Curación",
      manufacturer: "MedSupply",
      quantity: 128,
      minimumStock: 40,
      unit: Unit.ROLL,
      batchNumber: "LOT-2026-060",
      expirationDate: null,
      supplier: "Insumos Médicos SRL",
    },
    {
      name: "Gasas Estériles 10x10cm",
      genericName: null,
      category: "Material de Curación",
      manufacturer: "MedSupply",
      quantity: 3,
      minimumStock: 30,
      unit: Unit.PACK,
      batchNumber: "LOT-2026-061",
      expirationDate: new Date("2026-09-05"),
      supplier: "Insumos Médicos SRL",
    },
    {
      name: "Diclofenac 50mg",
      genericName: "Diclofenac sódico",
      category: "Analgésicos",
      manufacturer: "Farmalab",
      quantity: 580,
      minimumStock: 100,
      unit: Unit.UNIT,
      batchNumber: "LOT-2026-070",
      expirationDate: new Date("2027-03-15"),
      supplier: "Distribuidora Central",
    },
  ];

  for (const p of demoProducts) {
    const { category, ...rest } = p;
    const product = await prisma.product.upsert({
      where: { id: `demo-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` },
      update: {},
      create: {
        id: `demo-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        ...rest,
        categoryId: categories[category],
        isDemo: true,
      },
    });

    const existingMovement = await prisma.stockMovement.findFirst({ where: { productId: product.id } });
    if (!existingMovement && product.quantity > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          userId: admin.id,
          type: MovementType.STOCK_IN,
          quantity: product.quantity,
          reason: "Carga inicial de stock (demo)",
        },
      });
    }
  }

  console.log("Seed completado.");
  console.log("Usuarios de prueba:");
  console.log("  ADMIN -> admin@caps.local / Admin123!");
  console.log("  STAFF -> staff@caps.local / Staff123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
