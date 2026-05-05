import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Buffer } from 'node:buffer'

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  })
}

function requiredEnv(env, key) {
  const value = env[key]

  if (!value) {
    throw new Error(`${key} is not available to the functions runtime.`)
  }

  return value
}

async function bodyToString(body) {
  if (!body) {
    return ''
  }

  if (typeof body.transformToString === 'function') {
    return body.transformToString()
  }

  const chunks = []

  for await (const chunk of body) {
    chunks.push(Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString('utf8')
}

export default async function handler(_request, { env }) {
  try {
    const bucket = requiredEnv(env, 'NERDO_BLOB_BUCKET')
    const endpoint = requiredEnv(env, 'NERDO_BLOB_ENDPOINT')
    const region = env.NERDO_BLOB_REGION || env.AWS_REGION || 'nerdo-host-tampa'
    const key = 'nerdohost/vite-blob-check.json'
    const payload = {
      ok: true,
      message: 'Nerdo.host static functions can write and read managed Blob storage.',
      bucket,
      key,
      createdAt: new Date().toISOString(),
    }
    const body = JSON.stringify(payload)
    const client = new S3Client({
      region,
      endpoint,
      forcePathStyle: env.NERDO_BLOB_FORCE_PATH_STYLE !== 'false',
      credentials: {
        accessKeyId: env.NERDO_BLOB_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.NERDO_BLOB_SECRET_ACCESS_KEY || env.AWS_SECRET_ACCESS_KEY,
      },
    })

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: 'application/json',
      }),
    )

    const read = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )
    const readBody = await bodyToString(read.Body)

    return json(200, {
      ok: true,
      blob: 'connected',
      bucket,
      endpoint,
      region,
      key,
      bytesWritten: Buffer.byteLength(body),
      bytesRead: Buffer.byteLength(readBody),
      contentMatches: readBody === body,
      writtenAt: payload.createdAt,
      readBack: JSON.parse(readBody),
    })
  } catch (error) {
    return json(500, {
      ok: false,
      blob: 'error',
      message: error?.message || 'Blob storage check failed.',
    })
  }
}
