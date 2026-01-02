import { MessageTemplate, ResponseBodyComponent, ResponseHeaderComponent, ResponseButtonsComponent, ResponseComponent } from './template.api.types';

export interface TemplatePayloadParams {
	from: string;
	to: string;
	template: MessageTemplate;
	variables: Record<string, string>;
}

/**
 * Builds the SendZen/WhatsApp template payload based on the selected template structure
 * and the variables provided by the user in the n8n Resource Mapper.
 */
export function buildTemplatePayload(params: TemplatePayloadParams) {
	const { template, variables, from, to } = params;
	const templateComponents: any[] = [];

	if (!template.components) {
		return {
			from,
			to,
			type: 'template',
			template: {
				name: template.name,
				lang_code: template.language,
				components: [],
			},
		};
	}

	const processComponent = (component: ResponseComponent) => {
		switch (component.type) {
			case 'HEADER': {
				const header = component as ResponseHeaderComponent;
				if (header.format === 'TEXT' && header.text) {
					const tokens = header.text.match(/\{\{([^}]+)\}\}/g);
					if (tokens && tokens.length > 0) {
						const parameters = tokens.map((match) => {
							const inner = match.replace(/[{}]/g, '');
							const isNumber = /^\d+$/.test(inner);
							const fieldId = `header_param_${inner}`;
							const value = variables[fieldId] || match;

							return {
								type: 'text',
								text: value,
								...(isNumber ? {} : { parameter_name: inner }),
							};
						});

						templateComponents.push({
							type: 'header',
							parameters: parameters,
						});
					}
				} else if (header.format && ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'].includes(header.format)) {
					const mediaType = header.format.toLowerCase();
					const mediaUrl = variables['header_media_url'] || '';

					if (mediaUrl) {
						templateComponents.push({
							type: 'header',
							parameters: [
								{
									type: mediaType,
									[mediaType]: {
										link: mediaUrl,
									},
								},
							],
						});
					}
				}
				break;
			}

			case 'BODY': {
				const body = component as ResponseBodyComponent;
				if (body.text) {
					const tokens = body.text.match(/\{\{([^}]+)\}\}/g);
					if (tokens && tokens.length > 0) {
						const parameters = tokens.map((match) => {
							const inner = match.replace(/[{}]/g, '');
							const isNumber = /^\d+$/.test(inner);
							const fieldId = `body_param_${inner}`;
							const value = variables[fieldId] || match;

							return {
								type: 'text',
								text: value,
								...(isNumber ? {} : { parameter_name: inner }),
							};
						});

						templateComponents.push({
							type: 'body',
							parameters: parameters,
						});
					}
				}
				break;
			}

			case 'BUTTONS': {
				const buttonsComp = component as ResponseButtonsComponent;
				if (buttonsComp.buttons && buttonsComp.buttons.length > 0) {
					buttonsComp.buttons.forEach((button, buttonIndex) => {
						if (button.type === 'URL' && button.url) {
							const urlToken = button.url.match(/\{\{([^}]+)\}\}/);
							if (urlToken && urlToken[1]) {
								const inner = urlToken[1];
								const isNumber = /^\d+$/.test(inner);
								const fieldId = `button_${buttonIndex}_param_${inner}`;
								const value = variables[fieldId] || '123456';

								templateComponents.push({
									type: 'button',
									sub_type: 'url',
									index: buttonIndex,
									parameters: [
										{
											type: 'text',
											text: value,
											...(isNumber ? {} : { parameter_name: inner }),
										},
									],
								});
							}
						} else if ((button.type as any) === 'COPY_CODE') {
							const searchableText = (button as any).text || (button as any).url || '';
							const codeToken = searchableText.match(/\{\{([^}]+)\}\}/);
							if (codeToken && codeToken[1]) {
								const inner = codeToken[1];
								const isNumber = /^\d+$/.test(inner);
								const fieldId = `button_${buttonIndex}_param_${inner}`;
								const value = variables[fieldId] || '123456';

								templateComponents.push({
									type: 'button',
									sub_type: 'copy_code',
									index: buttonIndex,
									parameters: [
										{
											type: 'text',
											text: value,
											...(isNumber ? {} : { parameter_name: inner }),
										},
									],
								});
							}
						} else if (button.type === 'FLOW') {
							const flowButton = button as any;
							const flowAction: {
								flow_token?: string;
								flow_action_data?: any;
							} = {};

							const flowToken = variables[`button_${buttonIndex}_flow_token`];
							flowAction.flow_token = flowToken || 'unused';

							const customFlowActionData = variables[`button_${buttonIndex}_flow_action_data`];
							if (customFlowActionData) {
								try {
									flowAction.flow_action_data =
										typeof customFlowActionData === 'string'
											? JSON.parse(customFlowActionData)
											: customFlowActionData;
								} catch (error) {
									flowAction.flow_action_data = {};
								}
							} else if (flowButton.flow_id || flowButton.flow_action || flowButton.navigate_screen) {
								flowAction.flow_action_data = {};
								if (flowButton.flow_id) flowAction.flow_action_data.flow_id = flowButton.flow_id;
								if (flowButton.flow_action)
									flowAction.flow_action_data.flow_action = flowButton.flow_action;
								if (flowButton.navigate_screen)
									flowAction.flow_action_data.navigate_screen = flowButton.navigate_screen;
							}

							templateComponents.push({
								type: 'button',
								sub_type: 'flow',
								index: buttonIndex,
								parameters: [
									{
										type: 'action',
										action: flowAction,
									},
								],
							});
						}
					});
				}
				break;
			}
		}
	};

	template.components.forEach((comp) => processComponent(comp));

	return {
		from,
		to,
		type: 'template',
		template: {
			name: template.name,
			lang_code: template.language,
			components: templateComponents,
		},
	};
}
