import {
    IAuthenticateGeneric,
    ICredentialType,
    INodeProperties
  } from 'n8n-workflow';

  export class SendZenApi implements ICredentialType {
    name = 'sendZenApi';
    displayName = 'SendZen API';
    documentationUrl = 'https://sendzen.io/docs';

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
  }
