import { INodeProperties } from 'n8n-workflow';

export const ResourseProperties: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'Send Message',
			value: 'sendMessage',
		},
	],
	default: 'sendMessage',
	required: true,
}


export const OperationProperties: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	disabledOptions:{
		show:{
			resource: ['sendMessage'],
		}	
	},
	options: [
		{
			name: 'Send Session Message',
			value: 'sendSessionMessage',
			description: 'Send a free-form message within an active 24-hour WhatsApp conversation window',
			action: 'Send session message',
			hint: 'Use this option to reply to a user within an active conversation without using a template.',
		},
		{
			name: 'Send Template Message',
			value: 'sendTemplateMessage',
			description: 'Send a pre-approved WhatsApp template message to a recipient',
			action: 'Send template message',
			hint: 'Use this option when replying outside the 24-hour session window or when a template is required by WhatsApp.',
		},
		{
			name: 'Mark as Read',
			value: 'markAsRead',
			description:
				'Mark the incoming message as read.',
			action: 'Mark as read',
			hint: 'Use this option to mark the incoming message as read.',
		},
		{
			name: 'Show Typing Indicator',
			value: 'showTyping',
			description:
				'Display a typing indicator while the workflow continues.',
			action: 'Show typing indicator',
			hint: 'Use this option to show a typing indicator while the workflow continues.',
		},
	],
	default: 'sendSessionMessage',
	required: true,
	description: 'Choose how you want to interact with the recipient using SendZen.',
};

export const WabaAccountProperties: INodeProperties = {
	displayName: 'WABA Account',
	name: 'wabaAccount',
	type: 'options',
	noDataExpression: true,
	hint: 'Select the WhatsApp Business Account that will be used to send messages.',
	default: '',
	required: true,
	description: 'Select the WhatsApp Business Account (WABA)',
	typeOptions: {
		loadOptionsMethod: 'getWabaAccounts',
	},
	displayOptions: {
		show: {
			resource: ['sendMessage'],
			operation: ['sendSessionMessage', 'sendTemplateMessage'],
		},
	},
};

export const PhoneNumberIdProperties: INodeProperties = {
	displayName: 'Phone Number ID',
	name: 'phoneNumberId',
	type: 'string',
	hint: 'Enter the Phone Number ID associated with your WhatsApp Business account.',
	default: '',
	required: false,
	description:
		'The Phone Number ID used to mark the message as read and show the typing indicator.. If left empty, the node will try to find it automatically from the incoming data.',
	displayOptions: {
		show: {
			resource: ['sendMessage'],
			operation: ['markAsRead', 'showTyping'],
		},
	},
};

export const MessageIdProperties: INodeProperties = {
	displayName: 'Message ID (Optional)',
	name: 'messageId',
	type: 'string',
	required: false,
	default: '',
	description:
		'Optionally override the message ID. Leave empty to automatically use the incoming message ID from the previous node.',
	hint: 'Only use this if you need to manually specify a message ID. In most cases, this is resolved automatically.',
	displayOptions: {
		show: {
			resource: ['sendMessage'],
			operation: ['markAsRead', 'showTyping'],
		},
	},
};

export const RecipientPhoneNumberProperties: INodeProperties = {
	displayName: 'Recipient Phone Number',
	name: 'recipient',
	type: 'string',
	required: true,
	placeholder: '+1234567890',
	displayOptions: {
		show: {
			resource: ['sendMessage'],
			operation: ['sendSessionMessage', 'sendTemplateMessage'],
		},
	},
	default: '',
	description: 'The recipient’s phone number in international (E.164) format.',
	hint: 'Enter the phone number including country code, for example: +1234567890.',
};

export const TemplateProperties: INodeProperties = {
	displayName: 'Template',
	name: 'template',
	type: 'options',
	noDataExpression: true,
	typeOptions: {
		loadOptionsMethod: 'getTemplates',
		loadOptionsDependsOn: ['wabaAccount'],
	},
	required: true,
	displayOptions: {
		show: {
			resource: ['sendMessage'],
			operation: ['sendTemplateMessage'],
		},
	},
	default: '',
	description: 'Select a WhatsApp message template to send.',
	hint: 'Templates are pre-approved message formats that can include variables and media.',
};

export const ReplyMessageProperties: INodeProperties = {
	displayName: 'Message Text',
	name: 'replyMessage',
	type: 'string',
	required: true,
	placeholder: 'Type your message here…',
	displayOptions: {
		show: {
			resource: ['sendMessage'],
			operation: ['sendSessionMessage'],
		},
	},
	default: '',
	description: 'The text message that will be sent to the recipient.',
	typeOptions: {
		rows: 4,
	},
	hint: 'This message is sent immediately within an active WhatsApp session.',
};

export const EnableUrlPreviewProperties: INodeProperties = {
	displayName: 'Enable URL Preview',
	name: 'enableUrlPreview',
	type: 'boolean',
	default: false,
	description: 'Show a preview for URLs included in the message.',
	hint: 'Enable this to display link previews such as images and titles.',
	displayOptions: {
		show: {
			resource: ['sendMessage'],
			operation: ['sendSessionMessage'],
		},
	},
};

export const TemplateNameOrIdProperties: INodeProperties = {
	displayName: 'Template Variables',
	name: 'templateVariables',
	type: 'resourceMapper',
	noDataExpression: true,
	default: {
		mappingMode: 'defineBelow',
		value: null,
	},
	required: true,
	placeholder: 'Add template variables',
	description: 'Provide values for all variables required by the selected template.',
	hint: 'Variable names and requirements are automatically derived from the selected template.',
	displayOptions: {
		show: {
			resource: ['sendMessage'],
			operation: ['sendTemplateMessage'],
		},
	},
	typeOptions: {
		loadOptionsDependsOn: ['template'],
		resourceMapper: {
			resourceMapperMethod: 'getTemplateVariables',
			mode: 'add',
			fieldWords: {
				singular: 'variable',
				plural: 'variables',
			},
			addAllFields: true,
			multiKeyMatch: false,
			supportAutoMap: false,
		},
	},
};
