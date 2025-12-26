import {
    INodeType,
    INodeTypeDescription,
    IWebhookFunctions,
    IWebhookResponseData,
} from 'n8n-workflow';

export class SendZenTrigger implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'SendZen Trigger',
        name: 'sendZenTrigger',
        icon: 'file:sendzen.svg',
        group: ['trigger'],
        version: 1,
        subtitle: 'On Message Received',
        description: 'Trigger when a WhatsApp incoming message is received via SendZen Services',
        defaults: {
            name: 'Message Received Trigger',
        },
        inputs: [],
        outputs: ['main'],
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
        const webhookData = this.getRequestObject().body;
        return {
            workflowData: [this.helpers.returnJsonArray(webhookData)],
        };
    }
}


