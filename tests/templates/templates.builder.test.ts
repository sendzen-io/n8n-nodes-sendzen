import { buildTemplatePayload } from '../../shared/template/template.builder';
import { MessageTemplate } from '../../shared/template/template.api.types';

describe('buildTemplatePayload', () => {
	const defaultParams = {
		from: '1555000000',
		to: '+1234567890',
	};

	test('should build a basic payload with no components', () => {
		const template: MessageTemplate = {
			id: '1',
			name: 'simple_template',
			language: 'en_US',
			status: 'APPROVED',
			category: 'MARKETING',
			components: [],
		};

		const result = buildTemplatePayload({
			...defaultParams,
			template,
			variables: {},
		});

		expect(result).toEqual({
			from: defaultParams.from,
			to: defaultParams.to,
			type: 'template',
			template: {
				name: 'simple_template',
				lang_code: 'en_US',
				components: [],
			},
		});
	});

	test('should handle BODY text with Positional (Numeric) variables', () => {
		const template: MessageTemplate = {
			id: '1',
			name: 'body_test',
			language: 'en',
			status: 'APPROVED',
			category: 'UTILITY',
			components: [
				{
					type: 'BODY',
					text: 'Hello {{1}}, your code is {{2}}.',
				},
			],
		};

		const variables = {
			'body_param_1': 'John',
			'body_param_2': '9999',
		};

		const result = buildTemplatePayload({
			...defaultParams,
			template,
			variables,
		});

		const components = result.template.components;
		expect(components).toHaveLength(1);
		expect(components[0].type).toBe('body');
		expect(components[0].parameters).toHaveLength(2);

		// Positional parameters should NOT have 'parameter_name'
		expect(components[0].parameters[0]).toEqual({
			type: 'text',
			text: 'John',
		});
		expect(components[0].parameters[1]).toEqual({
			type: 'text',
			text: '9999',
		});
	});

	test('should handle BODY text with Named variables', () => {
		const template: MessageTemplate = {
			id: '1',
			name: 'named_test',
			language: 'en',
			status: 'APPROVED',
			category: 'MARKETING',
			components: [
				{
					type: 'BODY',
					text: 'Hi {{name}}, welcome to {{city}}.',
				},
			],
		};

		const variables = {
			'body_param_name': 'Alice',
			'body_param_city': 'Wonderland',
		};

		const result = buildTemplatePayload({
			...defaultParams,
			template,
			variables,
		});

		const params = result.template.components[0].parameters;

		// Named parameters MUST have 'parameter_name'
		expect(params[0]).toEqual({
			type: 'text',
			text: 'Alice',
			parameter_name: 'name',
		});
		expect(params[1]).toEqual({
			type: 'text',
			text: 'Wonderland',
			parameter_name: 'city',
		});
	});

	test('should handle HEADER with TEXT variables', () => {
		const template: MessageTemplate = {
			id: '1',
			name: 'header_text',
			language: 'en',
			status: 'APPROVED',
			category: 'MARKETING',
			components: [
				{
					type: 'HEADER',
					format: 'TEXT',
					text: 'Offer for {{1}}',
				},
			],
		};

		const variables = {
			'header_param_1': 'VIPs',
		};

		const result = buildTemplatePayload({
			...defaultParams,
			template,
			variables,
		});

		expect(result.template.components[0]).toEqual({
			type: 'header',
			parameters: [
				{
					type: 'text',
					text: 'VIPs',
				},
			],
		});
	});

	test('should handle HEADER with MEDIA (Image)', () => {
		const template: MessageTemplate = {
			id: '1',
			name: 'header_image',
			language: 'en',
			status: 'APPROVED',
			category: 'MARKETING',
			components: [
				{
					type: 'HEADER',
					format: 'IMAGE',
					example: { header_handle: ['url'] },
				},
			],
		};

		const variables = {
			'header_media_url': 'https://example.com/image.png',
		};

		const result = buildTemplatePayload({
			...defaultParams,
			template,
			variables,
		});

		expect(result.template.components[0]).toEqual({
			type: 'header',
			parameters: [
				{
					type: 'image',
					image: {
						link: 'https://example.com/image.png',
					},
				},
			],
		});
	});

	test('should handle HEADER with MEDIA (Video)', () => {
		const template: MessageTemplate = {
			id: '1',
			name: 'header_video',
			language: 'en',
			status: 'APPROVED',
			category: 'MARKETING',
			components: [
				{
					type: 'HEADER',
					format: 'VIDEO',
					example: { header_handle: ['url'] },
				},
			],
		};

		const variables = {
			'header_media_url': 'https://example.com/video.mp4',
		};

		const result = buildTemplatePayload({
			...defaultParams,
			template,
			variables,
		});

		expect(result.template.components[0]).toEqual({
			type: 'header',
			parameters: [
				{
					type: 'video',
					video: {
						link: 'https://example.com/video.mp4',
					},
				},
			],
		});
	});

	test('should handle HEADER with MEDIA (Document)', () => {
		const template: MessageTemplate = {
			id: '1',
			name: 'header_document',
			language: 'en',
			status: 'APPROVED',
			category: 'MARKETING',
			components: [
				{
					type: 'HEADER',
					format: 'DOCUMENT',
					example: { header_handle: ['url'] },
				},
			],
		};

		const variables = {
			'header_media_url': 'https://example.com/document.pdf',
		};

		const result = buildTemplatePayload({
			...defaultParams,
			template,
			variables,
		});

		expect(result.template.components[0]).toEqual({
			type: 'header',
			parameters: [
				{
					type: 'document',
					document: {
						link: 'https://example.com/document.pdf',
					},
				},
			],
		});
	});

	test('should handle HEADER with MEDIA (Audio)', () => {
		const template: MessageTemplate = {
			id: '1',
			name: 'header_audio',
			language: 'en',
			status: 'APPROVED',
			category: 'MARKETING',
			components: [
				{
					type: 'HEADER',
					format: 'AUDIO',
					example: { header_handle: ['url'] },
				},
			],
		};

		const variables = {
			'header_media_url': 'https://example.com/audio.mp3',
		};

		const result = buildTemplatePayload({
			...defaultParams,
			template,
			variables,
		});

		expect(result.template.components[0]).toEqual({
			type: 'header',
			parameters: [
				{
					type: 'audio',
					audio: {
						link: 'https://example.com/audio.mp3',
					},
				},
			],
		});
	});

	test('should handle URL Buttons with variables', () => {
		const template: MessageTemplate = {
			id: '1',
			name: 'button_url',
			language: 'en',
			status: 'APPROVED',
			category: 'MARKETING',
			components: [
				{
					type: 'BUTTONS',
					buttons: [
						{
							type: 'URL',
							text: 'Visit Website',
							url: 'https://site.com/{{token}}',
						},
					],
				},
			],
		};

		const variables = {
			'button_0_param_token': 'xyz123',
		};

		const result = buildTemplatePayload({
			...defaultParams,
			template,
			variables,
		});

		expect(result.template.components[0]).toEqual({
			type: 'button',
			sub_type: 'url',
			index: 0,
			parameters: [
				{
					type: 'text',
					text: 'xyz123',
					parameter_name: 'token',
				},
			],
		});
	});

	test('should handle COPY_CODE Buttons with variables', () => {
		// Mocking as any because COPY_CODE interface in provided types assumes specific structure
		const template: MessageTemplate = {
			id: '1',
			name: 'copy_code',
			language: 'en',
			status: 'APPROVED',
			category: 'MARKETING',
			components: [
				{
					type: 'BUTTONS',
					buttons: [
						{
							type: 'COPY_CODE',
							example: 'CODE123',
							text: 'Copy code {{1}}', // Assuming text holds the variable
						} as any,
					],
				},
			],
		};

		const variables = {
			'button_0_param_1': 'DISCOUNT50',
		};

		const result = buildTemplatePayload({
			...defaultParams,
			template,
			variables,
		});

		expect(result.template.components[0]).toEqual({
			type: 'button',
			sub_type: 'copy_code',
			index: 0,
			parameters: [
				{
					type: 'text',
					text: 'DISCOUNT50',
				},
			],
		});
	});

	test('should handle FLOW Buttons with JSON Action Data', () => {
		const template: MessageTemplate = {
			id: '1',
			name: 'flow_btn',
			language: 'en',
			status: 'APPROVED',
			category: 'MARKETING',
			components: [
				{
					type: 'BUTTONS',
					buttons: [
						{
							type: 'FLOW',
							text: 'Start Flow',
							flow_id: 123,
							flow_action: 'navigate',
							navigate_screen: 'HOME',
						},
					],
				},
			],
		};

		const variables = {
			'button_0_flow_token': 'FLOW_TOKEN_ABC',
			'button_0_flow_action_data': JSON.stringify({ product_id: '100' }),
		};

		const result = buildTemplatePayload({
			...defaultParams,
			template,
			variables,
		});

		expect(result.template.components[0]).toEqual({
			type: 'button',
			sub_type: 'flow',
			index: 0,
			parameters: [
				{
					type: 'action',
					action: {
						flow_token: 'FLOW_TOKEN_ABC',
						flow_action_data: {
							product_id: '100',
						},
					},
				},
			],
		});
	});

	test('should handle FLOW Buttons with Default Action Data when JSON variable is missing', () => {
		const template: MessageTemplate = {
			id: '1',
			name: 'flow_btn_defaults',
			language: 'en',
			status: 'APPROVED',
			category: 'MARKETING',
			components: [
				{
					type: 'BUTTONS',
					buttons: [
						{
							type: 'FLOW',
							text: 'Start Flow',
							flow_id: 999,
							flow_action: 'data_exchange',
							navigate_screen: 'WELCOME',
						},
					],
				},
			],
		};

		// No variables provided for flow action data
		const variables = {
			'button_0_flow_token': 'TOKEN_1',
		};

		const result = buildTemplatePayload({
			...defaultParams,
			template,
			variables,
		});

		expect(result.template.components[0].parameters[0].action).toEqual({
			flow_token: 'TOKEN_1',
			flow_action_data: {
				flow_id: 999,
				flow_action: 'data_exchange',
				navigate_screen: 'WELCOME',
			},
		});
	});
});
