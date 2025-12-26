import { SendZenApi } from '../../credentials/SendZenApi.credentials';
import { IAuthenticateGeneric } from 'n8n-workflow';

describe('SendZenApi Credentials', () => {
	let credentials: SendZenApi;

	beforeAll(() => {
		credentials = new SendZenApi();
	});

	test('should have the correct name', () => {
		expect(credentials.name).toBe('sendZenApi');
	});

	test('should have the correct display name', () => {
		expect(credentials.displayName).toBe('SendZen API');
	});

	test('should have the correct documentation URL', () => {
		expect(credentials.documentationUrl).toBe('https://sendzen.io/docs');
	});

	test('should have required properties', () => {
		expect(credentials.properties).toHaveLength(2);
	});

	test('should have required apiKey property', () => {
		const apiKeyProperty = credentials.properties[0];
		expect(apiKeyProperty.name).toBe('apiKey');
		expect(apiKeyProperty.type).toBe('string');
		expect(apiKeyProperty.displayName).toBe('API Key');
		expect(apiKeyProperty.typeOptions).toEqual({ password: true });
		expect(apiKeyProperty.default).toBe('');
	});

	test('should have required returnFullResponse property', () => {
		const returnFullResponseProperty = credentials.properties[1];
		expect(returnFullResponseProperty.name).toBe('returnFullResponse');
		expect(returnFullResponseProperty.type).toBe('boolean');
		expect(returnFullResponseProperty.displayName).toBe('Return Full Response');
		expect(returnFullResponseProperty.default).toBe(false);
		expect(returnFullResponseProperty.description).toBe('If enabled, the full HTTP response will be returned including the status code, headers, and body.');
	});

	test('should have correct authentication method', () => {
		expect(credentials.authenticate).toBeDefined();
		expect(credentials.authenticate.type).toBe('generic');

		const auth = credentials.authenticate as IAuthenticateGeneric;
		expect(auth.properties).toBeDefined();

		// Type assertion to ensure TypeScript knows the property exists
		if (auth.properties && auth.properties.headers) {
			expect(auth.properties.headers).toHaveProperty('Authorization');
			expect(auth.properties.headers.Authorization).toBe('=Bearer {{$credentials.apiKey}}');
		} else {
			throw new Error('Authentication properties or headers property is missing');
		}
	});
});
