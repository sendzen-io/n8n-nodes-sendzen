import {
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeOperationError,
	ResourceMapperFields,
} from 'n8n-workflow';

import { BASE_DOMAIN } from '../../shared/constants';
import { SendTextMessageRequest, WABAResponseList } from '../../shared/type';
import { isSendzenAPIErroResponse } from '../../shared/utils';
import {
	MessageTemplate,
	ResponseBodyComponent,
	ResponseHeaderComponent,
	ResponseButtonsComponent,
	TemplatesResponse,
	ResponseComponent,
} from '../../shared/template/template.api.types';
import { buildTemplatePayload } from '../../shared/template/template.builder';
import {
	ResourseProperties,
	OperationProperties,
	WabaAccountProperties,
	PhoneNumberIdProperties,
	MessageIdProperties,
	RecipientPhoneNumberProperties,
	TemplateProperties,
	ReplyMessageProperties,
	EnableUrlPreviewProperties,
	TemplateNameOrIdProperties,
} from '../../shared/nodeProperties';

const suffix_urls = {
	WABA_ACCOUNTS: `/v1/waba`,
	TEMPLATES: `/v1/{wabaId}/message_templates`,
	SEND_MESSAGE: `/v1/messages`,
	READ_TYPING_STATUS: `/v1/{phoneNumberId}/messages`,
};

export class SendZen implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SendZen for WhatsApp API',
		name: 'sendZen',
		icon: 'file:sendzen.svg',
		usableAsTool: true,
		group: ['output'],
		version: 1,
		subtitle:
			'={{ $parameter.operation === "sendSessionMessage" ? "Send Session Message" : ' +
			'$parameter.operation === "sendTemplateMessage" ? "Send Template Message" : ' +
			'$parameter.operation === "markAsRead" ? "Mark as Read" : ' +
			'$parameter.operation === "showTyping" ? "Show Typing Indicator" : ' +
			'"SendZen" }}',
		description: 'Build WhatsApp chatbots & automations: send messages, media, and notifications via the WhatsApp Cloud API.',
		defaults: {
			name: "SendZen",
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'sendZenApi',
				required: true,
			},
		],
		properties: [
			ResourseProperties,
			OperationProperties,
			WabaAccountProperties,
			PhoneNumberIdProperties,
			MessageIdProperties,
			RecipientPhoneNumberProperties,
			TemplateProperties,
			ReplyMessageProperties,
			EnableUrlPreviewProperties,
			TemplateNameOrIdProperties,
		],
	};

	methods = {
		loadOptions: {
			async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				const selectedWabaAccount = this.getNodeParameter('wabaAccount', '0') as string;
				let wabaId: string | undefined;
				try {
					const parsed = JSON.parse(selectedWabaAccount) as { wabaId?: string };
					wabaId = parsed.wabaId;
				} catch {
					wabaId = undefined;
				}
				if (!wabaId) {
					returnData.push({
						name: 'No Waba Account selected',
						value: 'notfound',
						description: 'No Waba Account was selected',
					});
					return returnData;
				}
				try {
					const templateOptions: IHttpRequestOptions = {
						method: 'GET',
						baseURL: BASE_DOMAIN,
						url: `${suffix_urls.TEMPLATES.replace('{wabaId}', wabaId)}`,
						headers: {
							Accept: 'application/json',
						},
					};
					const response: TemplatesResponse = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'sendZenApi',
						templateOptions,
					);
					const templatesArray = response?.data?.data ?? [];
					if (templatesArray.length > 0) {
						returnData.push(
							...templatesArray.map((t) => {
								return {
									name: t.name,
									value: JSON.stringify({
										templateId: t.id,
										language: t.language,
										category: t.category,
										components: t.components,
										status: t.status,
										name: t.name,
									}),
									description: `${t.language} - ${t.category}`,
								};
							}),
						);
					} else {
						returnData.push({
							name: 'No templates found',
							value: 'notfound',
							description: 'No templates were found for this Waba Account',
						});
					}
				} catch (error) {
					returnData.push({
						name: `Error: ${error.message}`,
						value: 'error',
						description: 'Failed to load templates',
					});
				}

				return returnData;
			},

			async getWabaAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];

				try {
					const wabaAccountsOptions: IHttpRequestOptions = {
						method: 'GET',
						baseURL: BASE_DOMAIN,
						url: suffix_urls.WABA_ACCOUNTS,
						headers: {
							Accept: 'application/json',
						},
					};

					const response: WABAResponseList = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'sendZenApi',
						wabaAccountsOptions,
					);

					if (Array.isArray(response?.data?.projects)) {
						for (const project of response?.data?.projects ?? []) {
							for (const waba of project.wabas ?? []) {
								returnData.push({
									name: `${waba.waba_business_name} (${waba.phone_number})`,
									value: JSON.stringify({
										wabaId: waba.waba_id,
										phoneNumber: waba.phone_number,
										phoneNumberId: waba.phone_number_id,
									}),
									description: `Project: ${project.project_name}`,
								});
							}
						}
					} else {
						returnData.push({
							name: 'No Waba Accounts found',
							value: 'notfound',
							description: 'No Waba Accounts were found for this user',
						});
					}
				} catch (error) {
					returnData.push({
						name: `Error: ${error.message}`,
						value: 'error',
						description: 'Failed to load Waba Accounts',
					});
				}
				return returnData;
			},
		},
		resourceMapping: {
			async getTemplateVariables(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				const returnData: ResourceMapperFields = { fields: [] };
				const addedIds = new Set<string>();

				try {
					const templateValue = this.getNodeParameter('template', '') as string;
					if (!templateValue || ['notfound', 'error'].includes(templateValue)) return returnData;

					let templateData: MessageTemplate;
					try {
						if (typeof templateValue === 'object' && templateValue !== null) {
							templateData = templateValue as any;
						} else if (typeof templateValue === 'string' && templateValue.trim().startsWith('{')) {
							templateData = JSON.parse(templateValue);
						} else {
							return returnData;
						}
					} catch {
						return returnData;
					}

					if (!templateData?.components) return returnData;

					const processComponent = (component: ResponseComponent) => {
						if (!component?.type) return;

						// --- BODY ---
						if (component.type === 'BODY') {
							const body = component as ResponseBodyComponent;
							if (body.text) {
								const matches = body.text.match(/\{\{([^}]+)\}\}/g) || [];
								for (const match of matches) {
									const innerMatch = match.match(/\{\{([^}]+)\}\}/);
									if (innerMatch && innerMatch[1]) {
										const inner = innerMatch[1];
										const fieldId = `body_param_${inner}`;
										if (!addedIds.has(fieldId)) {
											const isNumber = /^\d+$/.test(inner);
											const example = isNumber
												? (body.example?.body_text?.flatMap((arr) => arr)?.[
														parseInt(inner, 10) - 1
													] ?? '')
												: '';

											returnData.fields.push({
												id: fieldId,
												displayName: `Body Variable {{${inner}}}${example ? '. Example: ' + example : ''}`,
												required: true,
												display: true,
												type: 'string',
												defaultMatch: true,
												canBeUsedToMatch: true,
											});
											addedIds.add(fieldId);
										}
									}
								}
							}
						}

						// --- HEADER ---
						else if (component.type === 'HEADER') {
							const header = component as ResponseHeaderComponent;
							if (header.format === 'TEXT' && header.text) {
								const matches = header.text.match(/\{\{([^}]+)\}\}/g) || [];
								for (const match of matches) {
									const innerMatch = match.match(/\{\{([^}]+)\}\}/);
									if (innerMatch && innerMatch[1]) {
										const inner = innerMatch[1];
										const fieldId = `header_param_${inner}`;
										if (!addedIds.has(fieldId)) {
											returnData.fields.push({
												id: fieldId,
												displayName: `Header Variable {{${inner}}}`,
												required: true,
												display: true,
												type: 'string',
												defaultMatch: true,
												canBeUsedToMatch: true,
											});
											addedIds.add(fieldId);
										}
									}
								}
							} else if (header.format && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header.format)) {
								const fieldId = 'header_media_url';
								if (!addedIds.has(fieldId)) {
									returnData.fields.push({
										id: fieldId,
										displayName: `Header ${header.format} URL`,
										required: true,
										display: true,
										type: 'string',
										defaultMatch: true,
										canBeUsedToMatch: true,
									});
									addedIds.add(fieldId);
								}
							}
						}

						// --- BUTTONS ---
						else if (component.type === 'BUTTONS') {
							const buttonsComp = component as ResponseButtonsComponent;
							for (let i = 0; i < (buttonsComp.buttons || []).length; i++) {
								const button = buttonsComp.buttons[i];

								// 1. URL and COPY_CODE (Text/URL parameters)
								const searchableText = (button as any).url || (button as any).text || '';
								const matches = searchableText.match(/\{\{([^}]+)\}\}/g) || [];
								for (const match of matches) {
									const innerMatch = match.match(/\{\{([^}]+)\}\}/);
									if (innerMatch && innerMatch[1]) {
										const inner = innerMatch[1];
										const fieldId = `button_${i}_param_${inner}`;
										if (!addedIds.has(fieldId)) {
											returnData.fields.push({
												id: fieldId,
												displayName: `Button ${i + 1} Variable {{${inner}}}. Type: ${button.type}`,
												required: true,
												display: true,
												type: 'string',
												defaultMatch: true,
												canBeUsedToMatch: true,
											});
											addedIds.add(fieldId);
										}
									}
								}

								// 2. FLOW buttons (Specific token and data fields)
								if (button.type === 'FLOW') {
									const tokenField = `button_${i}_flow_token`;
									if (!addedIds.has(tokenField)) {
										returnData.fields.push({
											id: tokenField,
											displayName: `Button ${i + 1} Flow Token`,
											required: false,
											display: true,
											type: 'string',
											defaultMatch: true,
											canBeUsedToMatch: true,
										});
										addedIds.add(tokenField);
									}
									const dataField = `button_${i}_flow_action_data`;
									if (!addedIds.has(dataField)) {
										returnData.fields.push({
											id: dataField,
											displayName: `Button ${i + 1} Flow Action Data (JSON)`,
											required: false,
											display: true,
											type: 'string',
											defaultMatch: true,
											canBeUsedToMatch: true,
										});
										addedIds.add(dataField);
									}
								}
							}
						}
					};

					// Process all top-level components
					for (const component of templateData.components) processComponent(component);
				} catch (error) {
					// Fallback: return empty fields
					return returnData;
				}

				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'sendSessionMessage') {
					const selectedWabaAccount = this.getNodeParameter('wabaAccount', i) as string;
					const parsedWabaAccount = JSON.parse(selectedWabaAccount) as {
						wabaId?: string;
						phoneNumberId?: string;
						phoneNumber?: string;
					};
					let recipient = this.getNodeParameter('recipient', i) as string;
					if (!recipient.startsWith('+')) {
						recipient = '+' + recipient;
					}

					if (!/^\+[1-9]\d{7,14}$/.test(recipient)) {
						throw new NodeOperationError(
							this.getNode(),
							'Invalid phone number format. Use E.164, e.g. +1234567890.',
							{ itemIndex: i },
						);
					}

					const replyMessage = this.getNodeParameter('replyMessage', i) as string;
					const enableUrlPreview = this.getNodeParameter('enableUrlPreview', i, false) as boolean;
					const credentials = await this.getCredentials('sendZenApi');
					const returnFullResponse = (credentials?.returnFullResponse as boolean) ?? false;

					const requestOptions: IHttpRequestOptions = {
						method: 'POST' as IHttpRequestMethods,
						baseURL: BASE_DOMAIN,
						url: suffix_urls.SEND_MESSAGE,
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
						},
						body: {
							from: parsedWabaAccount.phoneNumber,
							to: recipient,
							type: 'text' as const,
							text: {
								body: replyMessage,
								preview_url: enableUrlPreview,
							},
						} as SendTextMessageRequest,
						returnFullResponse: returnFullResponse,
					};
					try {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'sendZenApi',
							requestOptions,
						);
						returnData.push({ json: response });
						continue;
					} catch (error) {
						if (error instanceof NodeApiError && error.description) {
							const cleanMessage = `${error.description}`;
							throw new NodeApiError(this.getNode(), {
								message: cleanMessage,
							});
						}
						if (isSendzenAPIErroResponse(error)) {
							const cleanMessage = `${error.message}, ${error.error.details}`;
							throw new NodeApiError(this.getNode(), {
								message: cleanMessage,
							});
						} else {
							throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
						}
					}
				} else if (operation === 'sendTemplateMessage') {
					const selectedWabaAccount = this.getNodeParameter('wabaAccount', i) as string;
					const parsedWabaAccount = JSON.parse(selectedWabaAccount) as {
						wabaId?: string;
						phoneNumberId?: string;
						phoneNumber?: string;
					};
					const recipient = this.getNodeParameter('recipient', i) as string;

					if (!/^\+[1-9]\d{7,14}$/.test(recipient)) {
						throw new NodeOperationError(
							this.getNode(),
							'Invalid phone number format. Use E.164, e.g. +1234567890.',
							{ itemIndex: i },
						);
					}

					const template = this.getNodeParameter('template', i) as string;
					const parsedTemplate = JSON.parse(template) as MessageTemplate;

					const templateVariables = this.getNodeParameter('templateVariables', i) as {
						value: Record<string, string>;
					};
					const variables = templateVariables.value || {};

					const payload = buildTemplatePayload({
						from: parsedWabaAccount.phoneNumber || '',
						to: recipient,
						template: parsedTemplate,
						variables,
					});

					const credentials = await this.getCredentials('sendZenApi');
					const returnFullResponse = (credentials?.returnFullResponse as boolean) ?? false;

					const requestOptions: IHttpRequestOptions = {
						method: 'POST' as IHttpRequestMethods,
						baseURL: BASE_DOMAIN,
						url: suffix_urls.SEND_MESSAGE,
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
						},
						body: payload,
						returnFullResponse: returnFullResponse,
					};

					try {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'sendZenApi',
							requestOptions,
						);
						returnData.push({ json: { response } });
						continue;
					} catch (error) {
						if (error instanceof NodeApiError && error.description) {
							const cleanMessage = `${error.description}`;
							throw new NodeApiError(this.getNode(), {
								message: cleanMessage,
							});
						}
						if (isSendzenAPIErroResponse(error)) {
							const cleanMessage = `${error.message}, ${error.error.details}`;
							throw new NodeApiError(this.getNode(), {
								message: cleanMessage,
							});
						} else {
							throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
						}
					}
				} else if (operation === 'markAsRead') {
					const manualPhoneNumberId = this.getNodeParameter('phoneNumberId', i) as string;
					const credentials = await this.getCredentials('sendZenApi');
					const returnFullResponse = (credentials?.returnFullResponse as boolean) ?? false;

					const phoneNumberId =
						manualPhoneNumberId ||
						items[i].json.phoneNumberId ||
						items[i].json.phone_number_id ||
						(items[i].json.entry as any)?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
					if (!phoneNumberId) {
						throw new NodeOperationError(this.getNode(), 'Phone Number ID could not be resolved.', {
							itemIndex: i,
						});
					}

					const manualMessageId = this.getNodeParameter('messageId', i, '') as string;
					const messageId = (manualMessageId ||
						(items[i].json.messages as any)?.[0]?.id ||
						(items[i].json.message as any)?.id ||
						items[i].json.message_id ||
						(items[i].json.entry as any)?.[0]?.changes?.[0]?.value?.messages?.[0]?.id) as string;

					if (!messageId) {
						throw new NodeOperationError(this.getNode(), 'Message ID could not be resolved.', {
							itemIndex: i,
						});
					}

					const requestOptions: IHttpRequestOptions = {
						method: 'POST',
						baseURL: BASE_DOMAIN,
						url: suffix_urls.READ_TYPING_STATUS.replace('{phoneNumberId}', phoneNumberId as string),
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
						},
						body: {
							messaging_product: 'whatsapp',
							status: 'read',
							message_id: messageId,
						},
						returnFullResponse,
					};

					try {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'sendZenApi',
							requestOptions,
						);
						returnData.push({ json: response });
						continue;
					} catch (error) {
						if (error instanceof NodeApiError && error.description) {
							const cleanMessage = `${error.description}`;
							throw new NodeApiError(this.getNode(), {
								message: cleanMessage,
							});
						}
						if (isSendzenAPIErroResponse(error)) {
							const cleanMessage = `${error.message}, ${error.error.details}`;
							throw new NodeApiError(this.getNode(), {
								message: cleanMessage,
							});
						} else {
							throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
						}
					}
				} else if (operation === 'showTyping') {
					const manualPhoneNumberId = this.getNodeParameter('phoneNumberId', i) as string;
					const credentials = await this.getCredentials('sendZenApi');
					const returnFullResponse = (credentials?.returnFullResponse as boolean) ?? false;

					const phoneNumberId =
						manualPhoneNumberId ||
						items[i].json.phoneNumberId ||
						items[i].json.phone_number_id ||
						(items[i].json.entry as any)?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
					if (!phoneNumberId) {
						throw new NodeOperationError(this.getNode(), 'Phone Number ID could not be resolved.', {
							itemIndex: i,
						});
					}

					const manualMessageId = this.getNodeParameter('messageId', i, '') as string;
					const messageId = (manualMessageId ||
						(items[i].json.messages as any)?.[0]?.id ||
						(items[i].json.message as any)?.id ||
						items[i].json.message_id ||
						(items[i].json.entry as any)?.[0]?.changes?.[0]?.value?.messages?.[0]?.id) as string;

					if (!messageId) {
						throw new NodeOperationError(this.getNode(), 'Message ID could not be resolved.', {
							itemIndex: i,
						});
					}

					const requestOptions: IHttpRequestOptions = {
						method: 'POST',
						baseURL: BASE_DOMAIN,
						url: suffix_urls.READ_TYPING_STATUS.replace('{phoneNumberId}', phoneNumberId as string),
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
						},
						body: {
							messaging_product: 'whatsapp',
							status: 'read',
							message_id: messageId,
							typing_indicator: {
								type: 'text',
							},
						},
						returnFullResponse,
					};

					try {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'sendZenApi',
							requestOptions,
						);
						returnData.push({ json: response });
						continue;
					} catch (error) {
						if (error instanceof NodeApiError && error.description) {
							const cleanMessage = `${error.description}`;
							throw new NodeApiError(this.getNode(), {
								message: cleanMessage,
							});
						}
						if (isSendzenAPIErroResponse(error)) {
							const cleanMessage = `${error.message}, ${error.error.details}`;
							throw new NodeApiError(this.getNode(), {
								message: cleanMessage,
							});
						} else {
							throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
						}
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Operation ${operation} is not supported`);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				// If it's already a NodeApiError, check if we need to update the message
				// Check both instanceof and constructor name for robustness
				if (error instanceof NodeApiError || error.constructor.name === 'NodeApiError') {
					// Check if this is a generic "Forbidden" error that needs custom message
					if (
						error.message.includes('Forbidden - perhaps check your credentials?') &&
						error.description
					) {
						const cleanMessage = `${error.description}`;
						throw new NodeApiError(this.getNode(), { message: cleanMessage });
					}
					throw error;
				}
				throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
