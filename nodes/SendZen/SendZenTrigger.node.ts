import {
    INodeType,
    INodeTypeDescription,
    IWebhookFunctions,
    IWebhookResponseData,
} from 'n8n-workflow';
import crypto from 'crypto';

export class SendZenTrigger implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'SendZen Trigger',
        name: 'sendZenTrigger',
        icon: 'file:sendzen.svg',
        usableAsTool: true,
        group: ['trigger'],
        version: 1,
        subtitle: 'On Message Received',
        description: 'Trigger when a WhatsApp incoming message is received via SendZen Services',
        defaults: {
            name: 'Message Received Trigger',
        },
        inputs: [],
        outputs: ['main'],
        credentials: [
            {
                name: 'sendZenWebhookApi',
                required: false,
            },
        ],
        webhooks: [
            {
                name: 'default',
                httpMethod: '={{$parameter["httpMethod"]}}',
                path: 'sendzen-webhook',
                isFullPath: false,
            }
        ],
        properties: [
            {
                displayName: 'HTTP Method',
                name: 'httpMethod',
                type: 'options',
                options: [
                    { name: 'POST', value: 'POST' },
                ],
                default: 'POST',
                description: 'Choose the HTTP method to use for the webhook',
            }
        ]
    };

    async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
        const req = this.getRequestObject();
        const res = this.getResponseObject();

        // Optional signature verification (recommended)
        try {
            const webhookCredentials = await this.getCredentials('sendZenWebhookApi').catch(() => undefined);
            const secretKey = (webhookCredentials?.secretKey as string | undefined) ?? '';

            if (secretKey) {
                const headerValue = req.headers['x-hub-signature-256'];
                const signatureHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;

                if (
                    typeof signatureHeader !== 'string' ||
                    !signatureHeader.startsWith('sha256=')
                ) {
                    res.status(401).send('Missing or invalid X-Hub-Signature-256 header');
                    return { noWebhookResponse: true };
                }

                const providedHex = signatureHeader.slice('sha256='.length).trim();

                // Verify against the raw payload if possible. If the body is already parsed,
                // we fall back to compact JSON to match SendZen's minified payloads.
                const bodyAny = (req as any).body;
                const payload =
                    typeof bodyAny === 'string'
                        ? bodyAny
                        : Buffer.isBuffer(bodyAny)
                            ? bodyAny.toString('utf8')
                            : JSON.stringify(bodyAny ?? {});

                const expectedHex = crypto.createHmac('sha256', secretKey).update(payload, 'utf8').digest('hex');

                const isValidHex = /^[0-9a-f]+$/i.test(providedHex) && providedHex.length === expectedHex.length;
                const isValid =
                    isValidHex &&
                    crypto.timingSafeEqual(Buffer.from(providedHex, 'hex'), Buffer.from(expectedHex, 'hex'));

                if (!isValid) {
                    res.status(401).send('Invalid signature');
                    return { noWebhookResponse: true };
                }
            }
        } catch {
            // If credential resolution fails, proceed without verification
        }

        const webhookData = req.body;
        return {
            workflowData: [this.helpers.returnJsonArray(webhookData)],
        };
    }
}


