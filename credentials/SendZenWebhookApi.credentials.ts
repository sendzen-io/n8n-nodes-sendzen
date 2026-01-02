import type { IAuthenticateGeneric, Icon, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class SendZenWebhookApi implements ICredentialType {
	name = 'sendZenWebhookApi';
	displayName = 'SendZen Webhook API';
	documentationUrl = 'https://sendzen.io/docs';
	icon: Icon = 'file:../nodes/SendZen/sendzen.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'SendZen API Key',
			name: 'apiKey',
			type: 'string',
			required: true,
			typeOptions: { password: true },
			default: '',
			description: 'SendZen API Key. Used to verify Secret Key for incoming webhooks.',
		},
		{
			displayName: 'SendZen Webhook Secret Key (Optional)',
			name: 'secretKey',
			type: 'string',
			required: false,
			typeOptions: { password: true },
			default: '',
			description:
				'Webhook signing secret from SendZen. Used to verify X-Hub-Signature-256 (sha256=...) for incoming webhooks.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
			Authorization: '=Bearer {{$credentials.apiKey}}',
			},
			qs: {
				secret: '={{$credentials.secretKey}}',
			}
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: "https://api.sendzen.io",
			url: `/v1/auth/api_key`,
			method: 'GET',
		},
		rules: [
			{
				type: 'responseCode',
				properties: {
					value: 200,
					message: "Valid API Key",
				},
			},
			{
				type: 'responseCode',
				properties: {
					value: 401,
					message: "Invalid API Key or Secret Key",
				},
			},
			{
				type: 'responseCode',
				properties: {
					value: 403,
					message: "Invalid API Key or Secret Key",
				},
			},
		]
	};
}


