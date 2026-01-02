import {
    IAuthenticateGeneric,
    Icon,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties
  } from 'n8n-workflow';

  export class SendZenApi implements ICredentialType {
    name = 'sendZenApi';
    displayName = 'SendZen API';
    documentationUrl = 'https://sendzen.io/docs';
	icon: Icon = 'file:../nodes/SendZen/sendzen.svg';

    properties: INodeProperties[] = [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'string',
        typeOptions: { password: true },
        default: '',
      },
			{
				displayName: 'Return Full Response',
				name: 'returnFullResponse',
				type: 'boolean',
				default: false,
				description: 'If enabled, the full HTTP response will be returned including the status code, headers, and body.',
			},
    ];

    authenticate: IAuthenticateGeneric = {
      type: 'generic',
      properties: {
        headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
        },
      },
    };

		test: ICredentialTestRequest= {
			request: {
				baseURL: "https://api.sendzen.io",
				url: '/v1/auth/api_key',
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
						message: "Invalid API Key",
					},
				},
				{
					type: 'responseCode',
					properties: {
						value: 403,
						message: "Invalid API Key",
					},
				},
			]
		};
  }
