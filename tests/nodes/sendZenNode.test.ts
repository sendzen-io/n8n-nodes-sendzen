import { SendZen } from '../../nodes/SendZen/SendZen.node';
import { INodeType, INodeTypeDescription, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import {
	TemplateNameOrIdProperties,
	WabaAccountProperties,
	OperationProperties,
	PhoneNumberIdProperties,
	MessageIdProperties,
	RecipientPhoneNumberProperties,
	TemplateProperties,
	ReplyMessageProperties,
	EnableUrlPreviewProperties,
	ResourseProperties,
} from '../../shared/nodeProperties';

describe('SendZen Node', () => {
	let node: SendZen;
	let description: INodeTypeDescription;
	let methods: INodeType['methods'];
	let properties: INodeTypeDescription['properties'];

	beforeAll(() => {
		node = new SendZen();
		description = node.description;
		properties = description.properties;
		methods = node.methods;
	});

	test('should have the correct Description', () => {
		expect(description.name).toBe('sendZen');
		expect(description.displayName).toBe('SendZen for WhatsApp API');
		expect(description.icon).toBe('file:sendzen.svg');
		expect(description.group).toHaveLength(1);
		expect(description.group?.[0]).toBe('output');
		expect(description.version).toBe(1);
		expect(description.subtitle).toBe(
			'={{ $parameter.operation === "sendSessionMessage" ? "Send Session Message" : $parameter.operation === "sendTemplateMessage" ? "Send Template Message" : $parameter.operation === "markAsRead" ? "Mark as Read" : $parameter.operation === "showTyping" ? "Show Typing Indicator" : "SendZen" }}',
		);
		expect(description.description).toBe(
			'Build WhatsApp chatbots & automations: send messages, media, and notifications via the WhatsApp Cloud API.',
		);
		expect(description.defaults).toBeInstanceOf(Object);
		expect(description.defaults?.name).toBe('SendZen');
		expect(description.inputs).toHaveLength(1);
		expect(description.inputs?.[0]).toBe('main');
		expect(description.outputs).toHaveLength(1);
		expect(description.outputs?.[0]).toBe('main');
		expect(description.credentials).toHaveLength(1);
		expect(description.credentials?.[0]).toBeInstanceOf(Object);
		expect(description.credentials?.[0]?.name).toBe('sendZenApi');
		expect(description.credentials?.[0]?.required).toBe(true);
		expect(description.properties).toBeInstanceOf(Array);
	});

	test('should have the correct Properties and length', () => {
		expect(properties).toHaveLength(10);
		expect(properties[0]).toBe(ResourseProperties);
		expect(properties[1]).toBe(OperationProperties);
		expect(properties[2]).toBe(WabaAccountProperties);
		expect(properties[3]).toBe(PhoneNumberIdProperties);
		expect(properties[4]).toBe(MessageIdProperties);
		expect(properties[5]).toBe(RecipientPhoneNumberProperties);
		expect(properties[6]).toBe(TemplateProperties);
		expect(properties[7]).toBe(ReplyMessageProperties);
		expect(properties[8]).toBe(EnableUrlPreviewProperties);
		expect(properties[9]).toBe(TemplateNameOrIdProperties);
	});

	test('should have the correct Methods', () => {
		expect(methods).toBeDefined();
		expect(methods?.loadOptions).toBeDefined();
		expect(methods?.resourceMapping).toBeDefined();
		const loadOptions = methods?.loadOptions;
		if(loadOptions){
			const loadOptionsKeys = Object.keys(loadOptions);
			expect(loadOptionsKeys).toHaveLength(2);
			expect(loadOptionsKeys[0]).toBe('getTemplates');
			expect(loadOptionsKeys[1]).toBe('getWabaAccounts');
		}
		const resourceMapping = methods?.resourceMapping;
		if(resourceMapping){
			const resourceMappingKeys = Object.keys(resourceMapping);
			expect(resourceMappingKeys).toHaveLength(1);
			expect(resourceMappingKeys[0]).toBe('getTemplateVariables');
		}
	});

	test('should have the correct values in Operation property', () => {
		expect(OperationProperties.name).toBe('operation');
		expect(OperationProperties.displayName).toBe('Operation');
		expect(OperationProperties.type).toBe('options');
		expect(OperationProperties.noDataExpression).toBe(true);
		expect(OperationProperties.options).toHaveLength(4);
		expect(OperationProperties.options?.[0]?.name).toBe('Send Session Message');
		expect(OperationProperties.options?.[1]?.name).toBe('Send Template Message');
		expect(OperationProperties.options?.[2]?.name).toBe('Mark as Read');
		expect(OperationProperties.options?.[3]?.name).toBe('Show Typing Indicator');
	});

	describe('execute', () => {
		let mockExecuteFunctions: any;
		let mockHttpRequest: jest.Mock;

		beforeEach(() => {
			// Reset mocks before each test
			mockHttpRequest = jest.fn();

			mockExecuteFunctions = {
				getInputData: jest.fn(),
				getNodeParameter: jest.fn(),
				getCredentials: jest.fn().mockResolvedValue({ returnFullResponse: false }),
				helpers: {
					httpRequestWithAuthentication: mockHttpRequest,
				},
				getNode: jest.fn().mockReturnValue({ name: 'SendZen' }),
				continueOnFail: jest.fn().mockReturnValue(false),
			};
		});

		// Helper to configure getNodeParameter to return specific values based on the parameter name
		const setupGetNodeParameter = (params: Record<string, any>) => {
			mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
				return params[paramName];
			});
		};

		test('should execute "sendSessionMessage" successfully', async () => {
			// 1. Setup Data
			mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]); // One item

			setupGetNodeParameter({
				operation: 'sendSessionMessage',
				wabaAccount: JSON.stringify({
					wabaId: 'waba_123',
					phoneNumber: '1555000000',
					phoneNumberId: 'phone_id_123',
				}),
				recipient: '+1234567890',
				replyMessage: 'Hello World',
				enableUrlPreview: true,
			});

			mockHttpRequest.mockResolvedValue({ success: true, messageId: 'msg_123' });

			// 2. Execute
			const result = await node.execute.call(mockExecuteFunctions as unknown as IExecuteFunctions);

			// 3. Assertions
			expect(mockHttpRequest).toHaveBeenCalledTimes(1);
			expect(mockHttpRequest).toHaveBeenCalledWith(
				'sendZenApi',
				expect.objectContaining({
					method: 'POST',
					url: '/v1/messages',
					body: {
						from: '1555000000',
						to: '+1234567890',
						type: 'text',
						text: {
							body: 'Hello World',
							preview_url: true,
						},
					},
				})
			);
			expect(result).toEqual([[{ json: { success: true, messageId: 'msg_123' } }]]);
		});

		test('should throw error for invalid recipient number in sendSessionMessage', async () => {
			mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
			setupGetNodeParameter({
				operation: 'sendSessionMessage',
				wabaAccount: JSON.stringify({ phoneNumber: '123' }),
				recipient: 'INVALID_NUMBER', // Invalid format
			});

			await expect(
				node.execute.call(mockExecuteFunctions as unknown as IExecuteFunctions)
			).rejects.toThrow(NodeOperationError);
		});

		test('should execute "sendTemplateMessage" successfully', async () => {
			mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);

			const mockTemplate = {
				name: 'hello_world',
				language: { code: 'en_US' },
				components: [],
			};

			setupGetNodeParameter({
				operation: 'sendTemplateMessage',
				wabaAccount: JSON.stringify({ phoneNumber: '1555000000' }),
				recipient: '+1234567890',
				template: JSON.stringify(mockTemplate),
				templateVariables: { value: {} },
			});

			mockHttpRequest.mockResolvedValue({ messages: [{ id: 'msg_123' }] });

			const result = await node.execute.call(mockExecuteFunctions as unknown as IExecuteFunctions);

			expect(mockHttpRequest).toHaveBeenCalledWith(
				'sendZenApi',
				expect.objectContaining({
					method: 'POST',
					url: '/v1/messages',
					body: expect.objectContaining({
						type: 'template',
						template: expect.objectContaining({
							name: 'hello_world',
						}),
					}),
				})
			);
			expect(result[0][0].json).toEqual({ response: { messages: [{ id: 'msg_123' }] } });
		});

		test('should execute "markAsRead" successfully using Manual Parameters', async () => {
			mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);

			setupGetNodeParameter({
				operation: 'markAsRead',
				phoneNumberId: 'pid_manual_123',
				messageId: 'mid_manual_123',
			});

			mockHttpRequest.mockResolvedValue({ success: true });

			await node.execute.call(mockExecuteFunctions as unknown as IExecuteFunctions);

			expect(mockHttpRequest).toHaveBeenCalledWith(
				'sendZenApi',
				expect.objectContaining({
					method: 'POST',
					url: '/v1/pid_manual_123/messages', // URL replacement check
					body: {
						messaging_product: 'whatsapp',
						status: 'read',
						message_id: 'mid_manual_123',
					},
				})
			);
		});

		test('should execute "markAsRead" successfully using Input JSON (Auto-resolve)', async () => {
			// Simulate incoming webhook data structure
			const inputItem = {
				json: {
					entry: [{
						changes: [{
							value: {
								metadata: { phone_number_id: 'pid_from_json' },
								messages: [{ id: 'mid_from_json' }]
							}
						}]
					}]
				}
			};
			mockExecuteFunctions.getInputData.mockReturnValue([inputItem]);

			// Return empty strings for manual params to trigger auto-resolution
			mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
				if (paramName === 'operation') return 'markAsRead';
				return '';
			});

			mockHttpRequest.mockResolvedValue({ success: true });

			await node.execute.call(mockExecuteFunctions as unknown as IExecuteFunctions);

			expect(mockHttpRequest).toHaveBeenCalledWith(
				'sendZenApi',
				expect.objectContaining({
					url: '/v1/pid_from_json/messages',
					body: expect.objectContaining({
						message_id: 'mid_from_json',
					}),
				})
			);
		});

		test('should execute "showTyping" successfully', async () => {
			mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);

			setupGetNodeParameter({
				operation: 'showTyping',
				phoneNumberId: 'pid_123',
				messageId: 'mid_123',
			});

			mockHttpRequest.mockResolvedValue({ success: true });

			await node.execute.call(mockExecuteFunctions as unknown as IExecuteFunctions);

			expect(mockHttpRequest).toHaveBeenCalledWith(
				'sendZenApi',
				expect.objectContaining({
					body: {
						messaging_product: 'whatsapp',
						status: 'read',
						message_id: 'mid_123',
						typing_indicator: {
							type: 'text',
						},
					},
				})
			);
		});

		test('should handle HTTP Errors correctly', async () => {
			mockExecuteFunctions.getInputData.mockReturnValue([{ json: {} }]);
			setupGetNodeParameter({
				operation: 'sendSessionMessage',
				wabaAccount: JSON.stringify({ phoneNumber: '1555000000' }),
				recipient: '+1234567890',
				replyMessage: 'Hi',
			});

			// Mock an error
			const error = new Error('API Error');
			mockHttpRequest.mockRejectedValue(error);

			await expect(
				node.execute.call(mockExecuteFunctions as unknown as IExecuteFunctions)
			).rejects.toThrow(NodeOperationError);
		});
	});
});
