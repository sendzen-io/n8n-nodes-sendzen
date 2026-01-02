import { SendZenWebhookApi } from '../../credentials/SendZenWebhookApi.credentials';

describe('SendZenWebhookApi Credentials', () => {
	let credentials: SendZenWebhookApi;

	beforeAll(() => {
		credentials = new SendZenWebhookApi();
	});

	test('should have the correct name', () => {
		expect(credentials.name).toBe('sendZenWebhookApi');
	});

	test('should have the correct display name', () => {
		expect(credentials.displayName).toBe('SendZen Webhook API');
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
		expect(apiKeyProperty.required).toBe(true);
		expect(apiKeyProperty.displayName).toBe('SendZen API Key');
		expect(apiKeyProperty.typeOptions).toEqual({ password: true });
		expect(apiKeyProperty.default).toBe('');
	});

	test('should have required secretKey property', () => {
		const secretKeyProperty = credentials.properties[1];
		expect(secretKeyProperty.name).toBe('secretKey');
		expect(secretKeyProperty.type).toBe('string');
		expect(secretKeyProperty.required).toBe(false);
		expect(secretKeyProperty.displayName).toBe('SendZen Webhook Secret Key (Optional)');
		expect(secretKeyProperty.typeOptions).toEqual({ password: true });
		expect(secretKeyProperty.default).toBe('');
	});
})
