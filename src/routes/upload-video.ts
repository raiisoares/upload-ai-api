import { prisma } from "../lib/prisma";
import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream";
import { promisify } from "node:util";

const pump = promisify(pipeline);

export async function uploadVideoRoute(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 25,
    },
  });

  app.post("/videos", async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: "Missing input file." });
    }

    const extension = path.extname(data.filename);

    if (extension !== ".mp3") {
      return reply
        .status(400)
        .send({ error: "Invalid input type, please a MP3." });
    }

    const fileBaseName = path.basename(data.filename, extension);
    const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`;

    const uploadDestination = path.resolve(
      __dirname,
      "../../tmp",
      fileUploadName
    );

    await pump(uploadDestination, fs.createWriteStream(uploadDestination));

    return reply.send()
  });
}
