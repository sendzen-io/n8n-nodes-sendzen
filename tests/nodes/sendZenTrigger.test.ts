// import { IWebhookFunctions, INodeTypeDescription } from 'n8n-workflow';
// import { SendZenTrigger } from '../../nodes/SendZen/SendZenTrigger.node';

// describe('SendZen Trigger Node', () => {
// 	let node: SendZenTrigger;
// 	let description: INodeTypeDescription;

// 	beforeAll(() => {
// 		node = new SendZenTrigger();
// 		description = node.description;
// 	});

// 	test('should have the correct Description', () => {
// 		expect(description.name).toBe('sendZenTrigger');
// 		expect(description.displayName).toBe('SendZen Trigger');
// 		expect(description.group).toBeInstanceOf(Array);
// 		expect(description.group?.[0]).toBe('trigger');
// 		expect(description.version).toBe(1);
// 		expect(description.subtitle).toBe('On Message Received');
// 		expect(description.description).toBe(
// 			'Trigger when a WhatsApp incoming message is received via SendZen Services',
// 		);
// 		expect(description.defaults).toBeInstanceOf(Object);
// 		expect(description.defaults?.name).toBe('Message Received Trigger');
// 		expect(description.inputs).toBeInstanceOf(Array);
// 		expect(description.inputs).toHaveLength(0);
// 		expect(description.outputs).toBeInstanceOf(Array);
// 		expect(description.outputs).toHaveLength(1);
// 		expect(description.outputs?.[0]).toBe('main');
// 		expect(description.webhooks).toBeInstanceOf(Array);
// 		expect(description.webhooks?.[0]).toBeInstanceOf(Object);
// 		expect(description.webhooks?.[0]?.name).toBe('default');
// 		expect(description.webhooks?.[0]?.httpMethod).toBe('={{$parameter[\"httpMethod\"]}}'); // may be fails
// 		expect(description.webhooks?.[0]?.path).toBe('sendzen-webhook');
// 		expect(description.webhooks?.[0]?.isFullPath).toBe(false);
// 		expect(description.properties).toBeInstanceOf(Array);
// 		expect(description.properties).toHaveLength(1);
// 		expect(description.properties?.[0]).toBeInstanceOf(Object);
// 		expect(description.properties?.[0]?.name).toBe('httpMethod');
// 		expect(description.properties?.[0]?.displayName).toBe('HTTP Method');
// 		expect(description.properties?.[0]?.type).toBe('options');
// 		expect(description.properties?.[0]?.options).toBeInstanceOf(Array);
// 		expect(description.properties?.[0]?.options).toHaveLength(1);
// 		expect(description.properties?.[0]?.options?.[0]).toBeInstanceOf(Object);
// 		let httpMethodOptions = description.properties?.[0]?.options?.[0];
// 		if (httpMethodOptions) {
// 			let httpMethodOptionsPair = Object.entries(httpMethodOptions);
// 			expect(httpMethodOptionsPair).toHaveLength(2);
// 			expect(httpMethodOptionsPair[0][0]).toBe('name');
// 			expect(httpMethodOptionsPair[0][1]).toBe('POST');
// 			expect(httpMethodOptionsPair[1][0]).toBe('value');
// 			expect(httpMethodOptionsPair[1][1]).toBe('POST');
// 		}
// 		expect(description.properties?.[0]?.description).toBe(
// 			'Choose the HTTP method to use for the webhook',
// 		);
// 		expect(description.properties?.[0]?.default).toBe('POST');
// 	});

// 	describe('webhook', () => {
// 		it('should process the incoming request body and return it as workflowData', async () => {
// 			// 1. Define the mock data that simulates an incoming webhook
// 			const mockWebhookData = {
// 				contact: {
// 					name: 'John Doe',
// 					wa_id: '15551234567',
// 				},
// 				message: {
// 					type: 'text',
// 					text: {
// 						body: 'Hello from SendZen!',
// 					},
// 				},
// 			};

// 			// 2. Create a mock 'this' context (IWebhookFunctions)
// 			// We only need to mock the methods our webhook actually uses.
// 			const mockContext: Partial<IWebhookFunctions> = {
// 				// Mock the function that gets the request
// 				getRequestObject: jest.fn().mockReturnValue({
// 					body: mockWebhookData, // This is what `this.getRequestObject().body` will return
// 					headers: {},
// 					params: {},
// 					query: {},
// 				}),
// 				// Mock the helper function that formats the output for n8n
// 				helpers: {
// 					// In n8n, returnJsonArray returns an array of INodeExecutionData.
// 					returnJsonArray: jest.fn((data) => {
// 						// Map the incoming data to the expected n8n output format.
// 						return data;
// 					}),
// 				} as any,
// 			};

// 			// 3. Execute the webhook method using .call() to inject our mock context
// 			// We use `as any` because our mockContext is a partial implementation.
// 			const result = await node.webhook.call(mockContext as IWebhookFunctions);

// 			// 4. Assert the results
// 			// Check that the helper was called with the correct data
// 			expect(mockContext.helpers?.returnJsonArray).toHaveBeenCalledWith(mockWebhookData);

// 			// Check that the final output structure is correct
// 			expect(result).toBeDefined();
// 			expect(result.workflowData).toEqual([mockWebhookData]);
// 		});
// 	});
// });

import {
	INodeTypeDescription,
	IWebhookFunctions,
} from 'n8n-workflow';
import { SendZenTrigger } from '../../nodes/SendZen/SendZenTrigger.node';

describe('SendZenTrigger', () => {
	let node: SendZenTrigger;
	let description: INodeTypeDescription;

	beforeAll(() => {
		node = new SendZenTrigger();
		description = node.description;
	});

	// Test for the node description object
	describe('description', () => {
		it('should have the correct static properties', () => {
			expect(description.name).toBe('sendZenTrigger');
			expect(description.displayName).toBe('SendZen Trigger');
			expect(description.group).toEqual(['trigger']);
			expect(description.version).toBe(1);
			expect(description.subtitle).toBe('On Message Received');
			expect(description.description).toBe(
				'Trigger when a WhatsApp incoming message is received via SendZen Services',
			);
			expect(description.defaults).toEqual({ name: 'Message Received Trigger' });
			expect(description.inputs).toEqual([]);
			expect(description.outputs).toEqual(['main']);
		});

		it('should have optional webhook credentials for signature verification', () => {
			expect(description.credentials).toEqual([
				{
					name: 'sendZenWebhookApi',
					required: false,
				},
			]);
		});

		it('should have the correct webhook definition', () => {
			expect(description.webhooks).toBeInstanceOf(Array);
			expect(description.webhooks?.[0]).toBeDefined();
			expect(description.webhooks?.[0].name).toBe('default');
			// IMPORTANT: Test the expression string itself, not the evaluated value
			expect(description.webhooks?.[0].httpMethod).toBe('={{$parameter["httpMethod"]}}');
			expect(description.webhooks?.[0].path).toBe('sendzen-webhook');
			expect(description.webhooks?.[0].isFullPath).toBe(false);
		});

		it('should have the correct properties for the UI', () => {
			const properties = description.properties;
			expect(properties).toBeInstanceOf(Array);
			expect(properties).toHaveLength(1);

			const httpMethodProperty = properties?.[0];
			expect(httpMethodProperty?.name).toBe('httpMethod');
			expect(httpMethodProperty?.displayName).toBe('HTTP Method');
			expect(httpMethodProperty?.type).toBe('options');
			expect(httpMethodProperty?.default).toBe('POST');
			expect(httpMethodProperty?.options).toEqual([{ name: 'POST', value: 'POST' }]);
		});
	});

	// Test for the webhook method
	describe('webhook', () => {
		it('should process the incoming request body and return it as workflowData', async () => {
			// 1. Define the mock data that simulates an incoming webhook
			const mockWebhookData = {
				contact: {
					name: 'John Doe',
					wa_id: '15551234567',
				},
				message: {
					type: 'text',
					text: {
						body: 'Hello from SendZen!',
					},
				},
			};

			// 2. Create a mock 'this' context (IWebhookFunctions)
			// We only need to mock the methods our webhook actually uses.
			const mockContext: Partial<IWebhookFunctions> = {
				// Mock the function that gets the request
				getRequestObject: jest.fn().mockReturnValue({
					body: mockWebhookData, // This is what `this.getRequestObject().body` will return
					headers: {},
					params: {},
					query: {},
				}),
				// Mock the function that gets the response (needed even if unused)
				getResponseObject: jest.fn().mockReturnValue({
					status: jest.fn().mockReturnThis(),
					send: jest.fn(),
					json: jest.fn(),
				}),
				// Mock the helper function that formats the output for n8n
				helpers: {
					// In n8n, returnJsonArray returns an array of INodeExecutionData.
					returnJsonArray: jest.fn((data) => {
						// Map the incoming data to the expected n8n output format.
						return data;
					}),
				} as any,
			};

			// 3. Execute the webhook method using .call() to inject our mock context
			// We use `as any` because our mockContext is a partial implementation.
			const result = await node.webhook.call(mockContext as IWebhookFunctions);

			// 4. Assert the results
			// Check that the helper was called with the correct data
			expect(mockContext.helpers?.returnJsonArray).toHaveBeenCalledWith(mockWebhookData);

			// Check that the final output structure is correct
			expect(result).toBeDefined();
			expect(result.workflowData).toEqual([mockWebhookData]);
		});
	});
});
