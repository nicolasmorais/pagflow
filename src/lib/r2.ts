import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"

let s3: S3Client | null = null

function getS3Client(): S3Client | null {
    if (s3) return s3
    if (!process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
        return null
    }
    s3 = new S3Client({
        region: process.env.S3_REGION || "auto",
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
        },
        forcePathStyle: true,
    })
    return s3
}

/**
 * Uploads a JSON backup of an order to R2.
 */
export async function uploadOrderBackup(order: any) {
    const client = getS3Client()
    if (!client || !process.env.S3_BUCKET) {
        console.warn('R2 not configured. Skipping backup.');
        return;
    }

    try {
        // Clean order object (remove circular refs if any, though prisma objects are usually clean)
        const body = JSON.stringify(order, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const key = `backups/orders/${order.id}_${timestamp}.json`;

        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            Body: body,
            ContentType: 'application/json',
        });

        await client.send(command);
        console.log(`✅ [R2 Backup] Uploaded successfully: ${key}`);
        return { success: true, key };
    } catch (error) {
        console.error('❌ [R2 Backup] Error:', error);
        return { success: false, error };
    }
}

/**
 * Uploads a generic file to R2 (e.g., product images).
 */
export async function uploadFile(file: Buffer, fileName: string, contentType: string) {
    const client = getS3Client()
    if (!client || !process.env.S3_BUCKET) return null;

    try {
        const key = `uploads/${Date.now()}_${fileName}`;
        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            Body: file,
            ContentType: contentType,
        });

        await client.send(command);

        // Construct public URL if a custom domain exists or use the default R2 dev domain 
        // Note: R2 needs a public bucket or a worker to serve files if no custom domain is set.
        // For now, we return the key.
        return key;
    } catch (error) {
        console.error('❌ [R2 Upload] Error:', error);
        return null;
    }
}

/**
 * Verifica se um pedido tem backup no R2.
 */
export async function verifyOrderBackup(orderId: string) {
    const client = getS3Client()
    if (!client || !process.env.S3_BUCKET) {
        return { exists: false, error: 'R2 não configurado' };
    }

    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.S3_BUCKET,
            Prefix: `backups/orders/${orderId}_`,
            MaxKeys: 1,
        });
        const response = await client.send(command);
        const hasBackup = (response.Contents?.length ?? 0) > 0;
        return {
            exists: hasBackup,
            key: hasBackup ? response.Contents![0].Key : null,
            lastModified: hasBackup ? response.Contents![0].LastModified : null,
        };
    } catch (error) {
        console.error('❌ [R2 Verify] Error:', error);
        return { exists: false, error: 'Erro ao verificar' };
    }
}

/**
 * Força re-upload de um pedido para R2.
 */
export async function forceOrderBackup(order: any) {
    const client = getS3Client()
    if (!client || !process.env.S3_BUCKET) {
        return { success: false, error: 'R2 não configurado' };
    }
    return await uploadOrderBackup(order);
}
